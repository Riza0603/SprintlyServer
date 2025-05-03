
import PDFDocument from "pdfkit";
import fs from "fs";
import moment from "moment";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

import ProjectModel from "../models/Projects.js";
import TaskModel from "../models/Tasks.js";
import UserModel from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateReport = async (req, res) => {
  try {
    const { projectName } = req.params;
    const { startDate, endDate } = req.body;

    const project = await ProjectModel.findOne({ pname: projectName });

    if (!project) return res.status(404).json({ error: "Project not found" });

    const query = { projectName: project.pname };

    if (startDate && endDate) {
      query.startDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const tasks = await TaskModel.find(query);


    const completedTasks = tasks.filter((t) => t.status === "Completed").length;
    const inProgressTasks = tasks.filter((t) => t.status === "In-Progress").length;
    const pendingTasks = tasks.length - (completedTasks + inProgressTasks);
    const progress = tasks.length > 0 ? Math.round((pendingTasks * 0 + inProgressTasks * 50 + completedTasks * 100) / tasks.length) : 0;

    // Check if the project exists and has a valid pname
    if (!project || !project.pname) {
      return res.status(400).json({ error: "Project name is undefined or project not found" });
    }

    // Fetch only teammates whose 'projects' array includes the project.pname
    // const teammates = await ProjectModel.find({ pname: project.pname });

    // Extract name and role from teammates for the PDF generation
    const memberIds = Array.from(project.members.keys());

    const users = await UserModel.find({ _id: { $in: memberIds } });

    const teamMembers = users.map((user) => {
      const details = project.members.get(user._id.toString());
      return {
        name: user.name,
        role: details?.position || "Employee",
      };
    });

    const doc = new PDFDocument({ margin: 40 });

    const ganttChartImagePath = path.join(__dirname, 'ganttchart.png');
    await downloadGanttChartImage(tasks, ganttChartImagePath);

    // Setup the filename and file path
    const filename = `ProjectReport_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, filename);

    // Create a write stream to save the PDF on the server
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Title
    doc.fillColor("#2E3A59").font("Helvetica-Bold").fontSize(24).text("PROJECT REPORT", { align: "center" }).moveDown(0.5);

    // Add Horizontal Navbar (filled bar)
    const navbarHeight = 20;
    doc.rect(45, doc.y, 520, navbarHeight).fill("#2E3A59").stroke();
    doc.moveDown(1.5);

    // Project Details
    doc.fontSize(18).fillColor("#1F2D3D").text("Project Details", { underline: true }).moveDown(0.5);
    doc.fontSize(14).fillColor("black").text(`Project: ${project.pname}`).moveDown(0.2);
    doc.text(`Description: ${project.pdescription}`).moveDown(0.2);
    doc.text(`Start Date: ${project.pstart ? moment(project.pstart).format("MMM DD, YYYY") : "N/A"}`).moveDown(0.2);
    doc.text(`End Date: ${project.pend ? moment(project.pend).format("MMM DD, YYYY") : "N/A"}`).moveDown(1);

    if (!project || !project.pstart) {
      console.log("pstart is undefined or project not found");
      return;
    }

    // Progress Bar
    doc.fontSize(18).fillColor("#1F2D3D").text("Project Progress", { underline: true }).moveDown(0.5);
    doc.fontSize(14).fillColor("black").text(`Progress: ${progress}%`).moveDown(0.3);
    doc.roundedRect(50, doc.y, 400, 15, 3).fill("#E0E0E0").stroke();
    doc.roundedRect(50, doc.y, (progress / 100) * 400, 15, 3).fill("#4CAF50").stroke().moveDown(2);

    //Team Members & Roles
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor("#1F2D3D").text("Team Members & Position", { underline: true }).moveDown(0.5);

    const teamTableTop = doc.y;
    const teamRowHeight = 20;
    const teamColWidths = [125, 125];

    doc.fontSize(12).fillColor("#FFFFFF").rect(50, teamTableTop, teamColWidths.reduce((a, b) => a + b, 0), teamRowHeight).fill("#2E3A59");
    doc.fillColor("#FFFFFF").text("Team Member", 90, teamTableTop + 5);
    doc.text("Position", 240, teamTableTop + 5);

    doc.fillColor("black").fontSize(10);
    let teamY = teamTableTop + teamRowHeight;
    teamMembers.forEach((member) => {
      const memberHeight = doc.heightOfString(member.name, { width: teamColWidths[0] - 5 });
      const teamRowHeightDynamic = Math.max(teamRowHeight, memberHeight + 10);

      // Draw row background
      doc.rect(50, teamY, teamColWidths.reduce((a, b) => a + b, 0), teamRowHeightDynamic).stroke();

      // Wrap text and center it vertically
      doc.text(member.name, 105, teamY + 5, { width: teamColWidths[0] - 5, align: "left" });
      doc.text(member.role || "Unknown", 190, teamY + 5, { width: teamColWidths[1], align: "center" });

      teamY += teamRowHeightDynamic;
    });

    doc.moveDown(1);

    // Task List with Completion Percentage
    doc.moveDown(1);
    doc.fontSize(18).fillColor("#1F2D3D").text("Task List", 42, doc.y, { underline: true }).moveDown(0.5);

    const pageHeight = doc.page.height - doc.page.margins.bottom;
    const rowHeight = 20;
    const colWidths = [150, 85, 120, 80, 100];

    function drawTableHeader(yPos) {
      doc.fontSize(12).fillColor("#FFFFFF")
        .rect(50, yPos, colWidths.reduce((a, b) => a + b, 0), rowHeight)
        .fill("#2E3A59");

      doc.fillColor("#FFFFFF").text("Task Title", 90, yPos + 5);
      doc.text("Assignee", 220, yPos + 5);
      doc.text("Created By", 330, yPos + 5);
      doc.text("Priority", 425, yPos + 5);
      doc.text("Status", 520, yPos + 5);
    }

    let y = doc.y;

    drawTableHeader(y);
    y += rowHeight;

    if (tasks.length === 0) {
      // Draw row border (like other rows)
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);
      doc.rect(50, y, totalWidth, rowHeight).stroke();

      // Draw centered text inside the row
      doc.fontSize(10)
        .fillColor("gray")
        .text("No tasks to display", 50, y + 5, {
          width: totalWidth,
          align: "center"
        });

      y += rowHeight; // Move cursor down if needed later

    } else {
      doc.fillColor("black").fontSize(10);

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const titleHeight = doc.heightOfString(task.title || "", { width: colWidths[0] - 5 });
        const rowHeightDynamic = Math.max(rowHeight, titleHeight + 10);

        if (y + rowHeightDynamic > pageHeight) {
          doc.addPage();
          y = doc.page.margins.top;
          drawTableHeader(y);
          y += rowHeight;
          i--;
          continue;
        }

        if (task && typeof task === "object") {
          doc.rect(50, y, colWidths.reduce((a, b) => a + b, 0), rowHeightDynamic).stroke();

          doc.text(task.title || "Untitled", 55, y + 5, { width: colWidths[0] - 5, align: "left" });
          doc.text(task.assignee || "Unknown", 205, y + 5, { width: colWidths[1], align: "center" });
          doc.text(task.createdBy || "Unknown", 305, y + 5, { width: colWidths[2], align: "center" });
          doc.text(task.priority || "N/A", 405, y + 5, { width: colWidths[3], align: "center" });

          const statusColor = task.status === "Completed"
            ? "#4CAF50"
            : task.status === "In-Progress"
              ? "#FFC107"
              : "#F44336";

          doc.fillColor(statusColor).text(task.status || "N/A", 485, y + 5, {
            width: colWidths[4],
            align: "center"
          });

          doc.fillColor("black");
          y += rowHeightDynamic;
        }
      }
    }


    function ensureSpace(requiredHeight) {
      if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
    }

    // === Workload Distribution Section ===
    ensureSpace(100);
    doc.moveDown(3);
    doc.fontSize(18).fillColor("#1F2D3D").text("Workload Distribution and Progress Bar", 42, doc.y, {
      underline: true,
    }).moveDown(0.5);

    // Calculate weighted workload scores
    const memberScores = {};
    let totalWeightedTasks = 0;

    tasks.forEach((task) => {
      if (task.assigneeId) {
        const weight = task.priority === "High" ? 3 : task.priority === "Medium" ? 2 : 1;
        memberScores[task.assigneeId] = (memberScores[task.assigneeId] || 0) + weight;
        totalWeightedTasks += weight;
      }
    });

    // Get member names from UserModel
    const memberId = Object.keys(memberScores);
    const userMap = {};
    const user = await UserModel.find({ _id: { $in: memberId } }).select("name");
    users.forEach(user => {
      userMap[user._id.toString()] = user.name;
    });

    // Calculate percentage and draw bars
    memberId.forEach((id) => {
      ensureSpace(40);
      const name = userMap[id] || "Unknown";
      const score = memberScores[id];
      const percent = totalWeightedTasks > 0 ? Math.round((score / totalWeightedTasks) * 100) : 0;

      doc.fontSize(12).fillColor("black").text(`${name}: ${percent}%`, 50, doc.y + 9);

      const barWidth = 300;
      doc.roundedRect(50, doc.y + 5, barWidth, 10, 3).fill("#E0E0E0").stroke();
      doc.roundedRect(50, doc.y + 5, (percent / 100) * barWidth, 10, 3).fill("#3498db").stroke().moveDown(1);
    });


    await downloadPieChartImage(progress);

    // === Pie Chart Section ===
    ensureSpace(220);
    doc.moveDown(2);
    doc.image("piechart.png", { width: 330, x: -5 });

    doc.moveDown(3);
    doc
      .font("Times-Italic")
      .fontSize(12)
      .fillColor("gray")
      .text("Fig: Pie chart showing the project progress", { align: "center" })
      .moveDown(1)
      .font("Times-Roman");

    // Labels for pie chart (Completed/Remaining boxes)
    const boxX = doc.x + 270;
    const completedBoxY = doc.y - 100;
    const remainingBoxY = completedBoxY + 22;

    doc.rect(boxX, completedBoxY, 30, 10).fill("#4CAF50");
    doc.rect(boxX, remainingBoxY, 30, 10).fill("#E0E0E0");

    doc.fontSize(12)
      .fillColor("black")
      .text(`Completed: ${progress}%`, doc.x + 310, completedBoxY)
      .moveDown(0.5)
      .text(`Remaining: ${100 - progress}%`);

    const ganttChartUrl = await generateGanttChart(tasks);

    // === Gantt Chart Section ===
    const ganttChartTitleHeight = 30;
    const ganttChartImageHeight = 300;
    const ganttSectionTotalHeight = ganttChartTitleHeight + ganttChartImageHeight + 30;

    const isSpaceAvailable = doc.y + ganttSectionTotalHeight <= doc.page.height - doc.page.margins.bottom;

    if (!isSpaceAvailable) {
      doc.addPage();
    } else {
      doc.moveDown(9);
    }

    doc.fontSize(18).fillColor("#1F2D3D").text("Project Timeline", 42, doc.y, {
      underline: true,
    }).moveDown(0.5);

    const ganttImageHeight = 300;
    doc.image(ganttChartImagePath, 50, doc.y, { width: 450, height: ganttImageHeight });
    doc.y += ganttImageHeight + 10; // Add spacing after image

    doc
      .font("Times-Italic")
      .fontSize(12)
      .fillColor("gray")
      .text("Fig: Gantt chart showing the project timeline", { align: "center" })
      .moveDown(2)
      .font("Times-Roman"); // restore default

    // End the PDF
    doc.end();

    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        res.download(filePath, filename, () => fs.unlinkSync(filePath));
      } else {
        res.status(500).json({ error: "Failed to generate PDF" });
      }
    }, 2000);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

async function generateGanttChart(tasks) {
  const taskData = tasks.map((task) => ({
    label: task.title,
    start: moment(task.startDate).format("YYYY-MM-DD"),
    end: moment(task.endDate).format("YYYY-MM-DD"),
    duration: moment(task.endDate).diff(moment(task.startDate), "days"),
    status: task.status,
  }));

  const chartConfig = {
    type: "bar",
    data: {
      labels: taskData.map((t) =>
        t.label.length > 20 ? t.label.slice(0, 17) + "..." : t.label
      ),
            datasets: [
        {
          label: "Task Duration (Days)",
          data: taskData.map((t) => t.duration),
          backgroundColor: taskData.map((t) =>
            t.status === "Completed"
              ? "#4CAF50" // Green for "Completed"
              : t.status === "In-Progress"
                ? "#FFC107" // Yellow for "In-Progress"
                : "#F44336" // Red for "No Progress"
          ),
          borderColor: "#000",
          borderWidth: 1.5,
        },
      ],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          title: { display: true, text: "Duration (Days)" },
        },
        y: { title: { display: true, text: "Tasks" } },
      },
      plugins: { legend: { display: false } },
    },
  };

  return `https://quickchart.io/chart?width=900&height=500&c=${encodeURIComponent(
    JSON.stringify(chartConfig)
  )}`;
}

async function downloadGanttChartImage(tasks, outputPath = "ganttchart.png") {
  // Generate the Gantt chart URL
  const chartUrl = await generateGanttChart(tasks);

  // Get the Gantt chart image as a buffer
  const response = await axios.get(chartUrl, { responseType: 'arraybuffer' });

  // Save the image to the specified output path
  fs.writeFileSync(outputPath, response.data);

  console.log(`Gantt chart image saved to ${outputPath}`);

}

async function generatePieChart(progress) {
  const pieChartConfig = {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: [progress, 100 - progress],
          backgroundColor: ["#4CAF50", "#E0E0E0"],
          borderColor: "#ffffff",
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      cutout: "70%",
      layout: {
        padding: { left: 10, right: 10 },
      },
      plugins: {
        legend: {
          display: true,
          position: "right",
          align: "right",
          labels: {
            font: { size: 16, weight: "bold" },
            boxWidth: 20,
            padding: 20,
            usePointStyle: true,
            generateLabels: (chart) => {
              const data = chart.data.datasets[0].data;
              return [
                {
                  text: `Completed (${data[0]}%)`,
                  fillStyle: "#4CAF50",
                  strokeStyle: "#4CAF50",
                  index: 0,
                  align: "right",
                },
                {
                  text: `Remaining (${data[1]}%)`,
                  fillStyle: "#E0E0E0",
                  strokeStyle: "#E0E0E0",
                  index: 1,
                  align: "right",
                },
              ];
            },
          },
        },
        datalabels: {
          display: false,
        },
      },
    },
  };

  return `https://quickchart.io/chart?width=500&height=300&c=${encodeURIComponent(
    JSON.stringify(pieChartConfig)
  )}`;
}

async function downloadPieChartImage(progress, outputPath = "piechart.png") {
  const chartUrl = await generatePieChart(progress);
  const response = await axios.get(chartUrl, { responseType: "arraybuffer" });
  fs.writeFileSync(outputPath, response.data);
}

async function generateWorkloadChart(tasks) {
  const memberWorkload = {};
  tasks.forEach((task) => {
    const assignee = task.assignee?.trim() || "NA";
    memberWorkload[assignee] = (memberWorkload[assignee] || 0) + 1;
  });

  const members = Object.keys(memberWorkload);
  const workloadPercentage = members.map(
    (member) => Math.round((memberWorkload[member] / tasks.length) * 100)
  );


  // Now creating a horizontal progress line instead of a bar chart
  const workloadChartConfig = {
    type: "horizontalBar",  // Make the bars horizontal
    data: {
      labels: members, // Each team member will have a label
      datasets: [
        {
          label: "Workload Distribution (%)",
          data: workloadPercentage,  // Workload data (percentage)
          backgroundColor: "rgba(54, 162, 235, 0.8)",
          borderColor: "#000",
          borderWidth: 1.5,
        },
      ],
    },
    options: {
      indexAxis: "y", // Set horizontal bars
      scales: {
        x: {
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`, // Display percentage on the axis
          },
        },
        y: {
          title: { display: true, text: "Team Members" },
        },
      },
      plugins: { legend: { display: false } },
    },
  };

  return `https://quickchart.io/chart?width=900&height=500&c=${encodeURIComponent(
    JSON.stringify(workloadChartConfig)
  )}`;
}


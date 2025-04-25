import cron from "node-cron";
import Task from "../models/Tasks.js";
import Project from "../models/Projects.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js"; // Assuming user model has user emails
import { sendEmail } from "./emailService.js";


cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const startOfDay = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfDay = new Date(tomorrow.setHours(23, 59, 59, 999));

    // ==== Task Deadline Reminders ====
    const tasksDueTomorrow = await Task.find({
      endDate: { $gte: startOfDay, $lte: endOfDay },
      assigneeId: { $ne: null },
    });

    for (const task of tasksDueTomorrow) {
      const trimmedDueDate = new Date(task.endDate).toISOString().split("T")[0];

      // Save in-app notification
      await Notification.create({
        user_id: task.assigneeId,
        type: "TaskDue",
        message: `Reminder: Task "${task.title}" is due tomorrow.`,
        entity_id: task._id,
        metadata: {
          taskName: task.title,
          projectName: task.projectName,
          dueDate: trimmedDueDate,
        },
      });

      const user = await User.findById(task.assigneeId);
      if (user?.email) {
        await sendEmail(
          user.email,
          `Task Due Tomorrow: ${task.title}`,
          {
            taskName: task.title,
            projectName: task.projectName,
            deadline: trimmedDueDate,
          },
          "deadlineReminder"
        );
      }
    }

    // ==== Project Deadline Reminders ====
    const projectsDueTomorrow = await Project.find({
      pend: { $gte: startOfDay, $lte: endOfDay },
    });

    for (const project of projectsDueTomorrow) {
      const trimmedDueDate = new Date(project.pend).toISOString().split("T")[0];

      for (const [userId, memberInfo] of project.members.entries()) {
        if (memberInfo.notifyinApp) {
          await Notification.create({
            user_id: userId,
            type: "ProjectDue",
            message: `Reminder: Project "${project.pname}" is due tomorrow.`,
            entity_id: project._id,
            metadata: {
              projectName: project.pname,
              dueDate: trimmedDueDate,
            },
          });

          // Send email notification
          const user = await User.findById(userId);
          if (user?.email) {
            await sendEmail(
              user.email,
              `Project Due Tomorrow: ${project.pname}`,
              {
                taskName: "—", 
                projectName: project.pname,
                deadline: trimmedDueDate,
              },
              "deadlineReminder"
            );
          }
        }
      }
    }

    console.log("Deadline reminders sent successfully.");
  } catch (error) {
    console.error("Cron job failed:", error);
  }
});

import ProjectModel from "../models/Projects.js";
import TaskModel from "../models/Tasks.js";
import UserModel from "../models/User.js";
import TimeSheetModel from "../models/TimeSheets.js";
import TempTimeModel from "../models/TempTime.js";
import { createNotification } from "./notificationController.js";
import mongoose from "mongoose";
import { sendProjectAdditionEmail, sendProjectRemovalEmail } from "../services/emailService.js";;

//create a new project
export const createProject = async (req, res) => {
  const { pname, pdescription, projectCreatedBy, pstart, pend, members,budget } = req.body;

  if (!pname || !pdescription || !pstart || !pend) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingProject = await ProjectModel.findOne({ pname })
    .collation({ locale: "en", strength: 2 });  //case insesitive search
    if (existingProject) {
      return res.status(400).json({
        message: "Project with the same name already exists",
      });
    }

    // Fetch the name of the project creator
    const creator = await UserModel.findById(projectCreatedBy).select("name");
    if (!creator) {
      return res.status(404).json({ message: "Project creator not found" });
    }

   // Convert array of memberIds into a Map object
   const membersMap = {};
   members.forEach(memberId => {
     membersMap[memberId] = {
       notifyinApp: true,
       notifyinEmail: true,
       position: memberId === projectCreatedBy ? "Project Manager" : "Employee",
     };
   });

    const project = await ProjectModel.create({ pname, pdescription, projectCreatedBy, pstart, pend,budget, members: membersMap });

    const users = await Promise.all(
      members.map(async (memberId) => {
        const user = await UserModel.findByIdAndUpdate(
          memberId,
          { $addToSet: { projects: pname } },
          { new: true }
        );
        return user ? user.email : null; // Collect email addresses
      })
    );

    await Promise.all(
      members.map(async (memberId) => {
        await createNotification({
          user_id: memberId,
          type: "Project",
          message: `You have been added to the project: ${pname}`,
          entity_id: project._id,
          metadata: {
            projectName: pname,
            createdBy: creator.name,
            startDate: pstart,
            endDate: pend,
          },
        });
      })
    );

    const emails = users.filter(email => email);

    if (emails.length > 0) {
      await sendProjectAdditionEmail(emails, pname, pdescription, pstart, pend);
    }

    return res.status(201).json({
      message: "Project created successfully and emails sent",
      project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.status(500).json({
      message: "Error creating project",
      error: error.message,
    });
  }
};

//fetches projects
export const fetchProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.find();
    res.status(200).json(projects);
  } catch (err) {
    console.error("Error in fetchProjects:", err.message);
    res.status(500).json({ message: err.message });
  }
};

//fetch project by name
export const getProjectByName = async (req, res) => {
  try {
    const { projectTitle } = req.params;
    const project = await ProjectModel.findOne({ pname: projectTitle });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(project);
  } catch (err) {
    console.error(err); 
    res.status(500).json({ message: "Error in getProjectByName()" });
  }
};


export const getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) return res.status(400).json({ error: "Project ID is required" });

    const project = await ProjectModel.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    res.status(200).json({ files: project.pAttachments });
  } catch (error) {
    console.error("Error fetching project files:", error);
    res.status(500).json({ error: "Failed to fetch project files" });
  }
}

//fetches project data by id
export const fetchProjectData = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};




export const updateProjectDeletedFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { removeAttachment } = req.body;

    if (!removeAttachment) {
      return res.status(400).json({ message: "Filename to remove is required." });
    }

    // Use `$pull` to remove the specified filename from `pAttachments`
    const updatedProject = await ProjectModel.findOneAndUpdate(
      { _id: projectId },
      { $pull: { pAttachments: removeAttachment } }, // Remove the specific file
      { new: true } // Return the updated document
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "File removed successfully", updatedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { newAttachment, ...updateData } = req.body;

    if (!projectId) return res.status(400).json({ error: "Project ID is required" });

    const project = await ProjectModel.findById(projectId);


    if (!project) return res.status(404).json({ error: "Project not found" });

    // Append new attachment to existing pAttachments

    const updateFields = {};

    if (newAttachment) {
      updateFields.$push = { pAttachments: newAttachment };  // Add new attachment to pAttachments
    }
    const updatedProject = await ProjectModel.findOneAndUpdate(
      { _id: projectId },
      updateFields,
      { new: true }  // `new: true` returns the updated document
    );

   

    res.status(200).json({ message: "Project updated successfully", updatedProject });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
};



// Update global notification settings
export const updateGlobalSettings = async (req, res) => {
  const { notifyInApp, notifyEmail } = req.body;

  try {
    await ProjectModel.updateMany(
      { [`members.${req.body.userId}`]: { $exists: true } },
      {
        $set: {
          [`members.${req.body.userId}.notifyinApp`]: notifyInApp,
          [`members.${req.body.userId}.notifyinEmail`]: notifyEmail,
        },
      }
    );    

    return res.status(200).json({
      message: "Global settings updated successfully",
      notifyInApp,
      notifyEmail,
    });
  } catch (error) {
    console.error("Error updating global settings:", error);
    return res.status(500).json({
      message: "Error updating global settings",
      error: error.message,
    });
  }
};


// Update notification settings for a specific project
export const updateProjectSettings = async (req, res) => {
  const { projectId } = req.params;
  const { userId, notifyInApp, notifyEmail } = req.body;

  try {
    const updatedProject = await ProjectModel.findOneAndUpdate(
      { _id: projectId, [`members.${userId}`]: { $exists: true } },
      {
        $set: {
          [`members.${userId}.notifyinApp`]: notifyInApp,
          [`members.${userId}.notifyinEmail`]: notifyEmail,
        },
      },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project or user not found" });
    }

    return res.status(200).json({
      message: "Project settings updated successfully",
      updatedProject,
    });
  } catch (error) {
    console.error("Error updating project settings:", error);
    return res.status(500).json({
      message: "Error updating project settings",
      error: error.message,
    });
  }
};


//get position details from project and name from register
export const getMembers = async (req, res) => {
  try {
    const projName = req.params.projectName;
    const project = await ProjectModel.findOne({ pname: projName });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Convert Mongoose Map to JavaScript Map
    const membersMap = new Map(project.members);
    const memberIds = Array.from(membersMap.keys()); // Get keys correctly

    if (memberIds.length === 0) {
      return res.status(400).json({ message: "No members found in the project" });
    }

    const membersData = await UserModel.find({ _id: { $in: memberIds.map(id => new mongoose.Types.ObjectId(id)) } }, "name email");

    const members = membersData.map((member) => ({
      _id: member._id,
      name: member.name,
      email: member.email,
      role: membersMap.get(member._id.toString()).position,
    }));

    res.status(200).json(members);
  } catch (error) {
    console.error("Error in getMembers", error.message);
    res.status(500).json({ message: error.message });
  }
};


// Remove member from project
export const deleteMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { projectName, removedBy } = req.body;

    // Remove member from the project
    const updateProject = await ProjectModel.findOneAndUpdate(
      { pname: projectName },
      { $unset: { [`members.${memberId}`]: "" } },
      { new: true }
    );

    if (!updateProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    const user = await UserModel.findByIdAndUpdate(
      memberId,
      { $pull: { projects: projectName } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Member not found in project" });
    }

    // Send removal email
    await sendProjectRemovalEmail(user, projectName);

    // Helper to format date
    const formatDate = (date) => date?.toISOString().split("T")[0];

    // Create notification
    await createNotification({
      user_id: memberId,
      type: "ProjectRemoval",
      message: `You have been removed from the project: ${projectName}`,
      entity_id: updateProject._id,
      metadata: {
        projectName,
        removedBy: removedBy || "Someone",
        startDate: formatDate(updateProject.pstart),
        endDate: formatDate(updateProject.pend),
        removalDate: formatDate(new Date()),
      },
    });

    res
      .status(200)
      .json({ message: "Member deleted successfully, notification and email sent" });
  } catch (err) {
    console.error("Error deleting member:", err);
    res
      .status(500)
      .json({ message: "Error deleting member", error: err.message });
  }
};



//add members to project
export const addMember = async (req, res) => {
  try {
    const { _id, projectName, position, } = req.body;

    const project = await ProjectModel.findOneAndUpdate(
      { pname: projectName },
      { $set: { [`members.${_id}`]: { notifyInApp: true, notifyInEmail: true, position: position } } }, // Add to Map
      { new: true }
    );

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const member = await UserModel.findByIdAndUpdate(
      _id,
      {
        $addToSet: { projects: projectName },
        role: position
      },
      { new: true }
    );
    

    // Fetch the name of the project creator
    const creator = await UserModel.findById(project.projectCreatedBy).select("name");
    if (!creator) {
      return res.status(404).json({ message: "Project creator not found" });
    }

    await sendProjectAdditionEmail([member.email], projectName, project.pdescription, project.pstart, project.pend);
    // Create notification
    await createNotification({
      user_id: _id,
      type: "Project",
      message: `You have been added to the project: ${projectName}`,
      entity_id: project._id,
      metadata: {
        projectName: projectName,
        createdBy: creator.name || "Someone",
        startDate: formatDate(project.pstart),
        endDate: formatDate(project.pend),
      },      
    });

    res.status(200).json(member);
  } catch (err) {
    res.status(500).json({ message: "Error adding member", error: err.message });
  }
};

const formatDate = (date) => {
  return date.toISOString().split("T")[0]; // returns 'YYYY-MM-DD'
};


//delete from both user and project table
export const deleteUser= async (req,res)=>{
  try{
    const memberId=req.params.memberId;
   
    const updateProject = await ProjectModel.updateMany(
      { [`members.${memberId}`]: { $exists: true } },
      { $unset: { [`members.${memberId}`]: "" } }
    );

    const updateUser = await UserModel.findByIdAndDelete(memberId);
    if(!updateProject){
      return res.status(404).json({ message: "Member not found in project",  });
    }
    res.status(200).json({ message: "Member deleted successfully" });
  }catch(err){
    res.status(500).json({ message: "Error deleting member", err });
  }
}

// Fetches the projects by userId
export const fetchProjectsById = async (req, res) => {
  try {
    const { userId } = req.body;

    const projects = await ProjectModel.find({ [`members.${userId}`]: { $exists: true } });

    if (!projects.length) {
      return res.status(404).json({ message: "No projects found for this userId" });
    }

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error in fetchProjectsById:", err.message);
    res.status(500).json({ message: err.message });
  }
};


//To  calculate workload per member
export const fetchWorkLoad = async (req, res) => {
  try {
    const { pname } = req.query;

    const project = await ProjectModel.findOne({ pname });
    if (!project || !project.members) {
      return res.status(404).json({ message: "Project not found" });
    }

    const memberIds = Array.from(project.members.keys()).filter(id => mongoose.Types.ObjectId.isValid(id));

    if (memberIds.length === 0) {
      return res.status(404).json({ message: "No valid members found" });
    }

    const members = await UserModel.find({ _id: { $in: memberIds } }).select("name _id");
    if (!members.length) {
      return res.status(404).json({ message: "Members not found" });
    }

    const tasks = await TaskModel.find({
      assigneeId: { $in: members.map(m => m._id) },
      projectName: pname
    });

    if (!tasks || tasks.length === 0) {
      return res.json({
        projectName: pname,
        members: members.map((member) => ({
          id: member._id,
          name: member.name,
          workload: 0,
          workloadPercentage: 0,
        })),
      });
    }

    const totalTasks = tasks.length;
    let totalWeightSum = 0;

    const workloadData = members.map((member) => {
      const userTasks = tasks.filter((task) => task.assigneeId.toString() === member._id.toString());

      const workloadScore = userTasks.reduce((total, task) => {
        const priorityWeight = task.priority === "High" ? 3 : task.priority === "Medium" ? 2 : 1;
        return total + priorityWeight;
      }, 0);

      const weight = totalTasks > 0 ? workloadScore / totalTasks : 0;
      totalWeightSum += weight;

      return { id: member._id, name: member.name, workloadScore, weight };
    });

    const finalWorkloadData = workloadData.map((member) => {
      const workloadPercentage = totalWeightSum > 0 ? Math.round((member.weight / totalWeightSum) * 100) : 0;

      return {
        id: member.id,
        name: member.name,
        workload: member.workloadScore,
        workloadPercentage: parseFloat(workloadPercentage),
      };
    });

    finalWorkloadData.sort((a, b) => b.workloadPercentage - a.workloadPercentage);

    res.json({ projectName: pname, members: finalWorkloadData });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
};



//get project name by creator id
export const getProjectByManager=async(req,res)=>{
  try{
    const {projectCreatedById}=req.params;
    const project=await ProjectModel.find({projectCreatedBy:projectCreatedById},"pname");
   
    if(!project){
      return res.status(404).json({message:"No project found"})
    }
    res.status(200).json(project);  
}
catch (err) {
  console.error("Error:", err);
  res.status(500).json({ error: err.message });
}
};


export const updateProjectLink = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { link, description,lName, updateData } = req.body;  

    console.log(link, description, projectId, updateData);

    const project = await ProjectModel.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (updateData === "Add") {
      if (!link || !description || !lName) {
        return res.status(400).json({ message: "Link and description are required" });
      }
      project.pLinks.push({ link, description, lName });  // Store both link & description
    } 
    else if (updateData === "Delete") {
      project.pLinks = project.pLinks.filter(existingLink => existingLink.link !== link);
    }

    await project.save();
    
    res.status(200).json({ message: "Project updated successfully", project });
  } catch (err) {
    console.error("Error updating project:", err);
    res.status(500).json({ message: "Failed to update project", error: err.message });
  }
};






//Schedules variance
export const scheduleVariance = async (req, res) => {
  try {
    const { projectName } = req.params;
    const tasks = await TaskModel.find({ projectName });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found for this project" });
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "Completed").length;

    const startDates = tasks.map(task => task.startDate).filter(date => date);
    const endDates = tasks.map(task => task.endDate).filter(date => date);

    if (startDates.length === 0 || endDates.length === 0) {
      return res.status(400).json({ message: "Start and End dates required for Schedule Variance calculation" });
    }

    const projectStartDate = new Date(Math.min(...startDates.map(date => new Date(date).getTime())));
    const projectEndDate = new Date(Math.max(...endDates.map(date => new Date(date).getTime())));

    let totalProjectDuration = (projectEndDate - projectStartDate) / (1000 * 60 * 60 * 24);
    totalProjectDuration = totalProjectDuration < 1 ? 1 : totalProjectDuration; // Ensure at least 1 day

    let daysPassed = (new Date() - projectStartDate) / (1000 * 60 * 60 * 24);
    daysPassed = Math.max(daysPassed, 1); // Ensure daysPassed is at least 0


    const plannedCompletion = Math.min((daysPassed / totalProjectDuration) * 100, 100);
    const actualCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const scheduleVariance = actualCompletion - plannedCompletion;
    res.json({ projectName, totalTasks, completedTasks, plannedCompletion, actualCompletion, scheduleVariance });

  } catch (error) {
    console.error("Error calculating Schedule Variance:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Project Effort Distribution
export const effortDistribution = async (req, res) => {
  try {
    const { projectName } = req.params;

    const timesheets = await TimeSheetModel.find({
      "timeSheet.projectsHours.projectName": projectName,
    });

    if (timesheets.length === 0) {
      return res.status(404).json({ message: "No time logs found for this project" });
    }

    let userTotalHours = {}; 
    let userProjectHours = {}; 

    for (const timesheet of timesheets) {
      for (const entry of timesheet.timeSheet) {
        for (const project of entry.projectsHours) {
          if (project.status === "Approved") {  // Extract time only if status is Approved
            const timeInHours = project.time / (1000 * 60 * 60); 
            const userId = timesheet.userId.toString();

            if (!userTotalHours[userId]) {
              userTotalHours[userId] = 0;
            }
            userTotalHours[userId] += timeInHours;

            if (project.projectName === projectName) {
              if (!userProjectHours[userId]) {
                userProjectHours[userId] = 0;
              }
              userProjectHours[userId] += timeInHours;
            }
          }
        }
      }
    }

    const userIds = Object.keys(userProjectHours);
    const users = await UserModel.find({ _id: { $in: userIds } }, "name");

    const effortDistribution = users.map((user) => {
      const projectHours = userProjectHours[user._id] || 0;
      const totalHours = userTotalHours[user._id] || 0;
      const effortPercentage = totalHours > 0 ? (projectHours / totalHours) * 100 : 0;

      return {
        member: user.name,
        hours: projectHours.toFixed(2),
        effortPercentage: effortPercentage.toFixed(2),
      };
    });

    res.json({ projectName, effortDistribution });
  } catch (error) {
    console.error("Error fetching project effort distribution:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Project engagement rate(Time allocation overview)
export const projectEngagementRate = async (req, res) => {
  try {
    const { projectName } = req.params;

    const project = await ProjectModel.findOne({ pname: projectName });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const totalMembers = project.members instanceof Map 
    ? project.members.size 
    : Object.keys(project.members || {}).filter(key => !key.startsWith("$")).length;

    if (totalMembers === 0) {
      return res.status(200).json({ projectName, engagementRate: 0, totalMembers, activeUsers: 0, activeUserNames: [] });
    }

    const activeUsers = await TempTimeModel.find({
      projectName,
      started: true,
      paused: false,
    }).select("userId");

    const activeUserIds = activeUsers.map((user) => user.userId);

    const activeUserNames = await UserModel.find({ _id: { $in: activeUserIds } },"name");

    const engagementRate = (activeUsers.length / totalMembers) * 100;

    res.json({
      projectName,
      engagementRate: engagementRate.toFixed(2),
      totalMembers,
      activeUsers: activeUsers.length,
      activeUserNames: activeUserNames.map((user) => user.name),
    });
  } catch (error) {
    console.error("Error fetching project engagement rate:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProjectStatus= async (req,res)=>{
  try{
    const {projectName}=req.params;
    
    const Tasks= await TaskModel.find({projectName});
    
    const totalTasks= Tasks.length;
    const completedTasks=Tasks.filter(task=>task.status==="Completed").length;
    const delayedTasks=Tasks.filter(task=>task.endDate< new Date() && task.status!=="Completed").length;
 
    const delayPercentage= delayedTasks/totalTasks*100;
    if(totalTasks===completedTasks && totalTasks!=0 ){
     
      await ProjectModel.findOneAndUpdate({pname:projectName},{pstatus:"Completed"},{new:true});
      
    }else if(delayPercentage>=75){
      await ProjectModel.findOneAndUpdate({pname:projectName},{pstatus:"Delayed"},{new:true});
      
    }else{
      await ProjectModel.findOneAndUpdate({pname:projectName},{pstatus:"In-Progress"},{new:true});
    }
    res.status(200).json({message:"Project status updated "})
  
  }catch(error){
    res.status(500).json({message:"Server error in updateProjectStatus()",error:error.message})

  }
}
//Update Project admin
export const updateProjects = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    // Validate: Check if request body is empty
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    // *Check if a project with the same name already exists (excluding the current project)*
    if (updateData.pname) {
      const existingProject = await ProjectModel.findOne({ 
        pname: updateData.pname, 
        _id: { $ne: projectId } // Excluding current project from the check
      });

      if (existingProject) {
        return res.status(400).json({ message: "Project with this name already exists. Please choose a different name." });
      }
    }

     // member update logic for Map type Project.js
     if (updateData.members) {
      const formattedMembers = {};
      updateData.members.forEach((memberId) => {
        formattedMembers[memberId] = { notifyinApp: true, notifyinEmail: true, position: "Employee" }; // Default values
      });

      // Ensure updated project manager is assigned correct role
      if (updateData.projectCreatedBy) {
        formattedMembers[updateData.projectCreatedBy] = {
          notifyinApp: true,
          notifyinEmail: true,
          position: "Project Manager"
        };
      }

      updateData.members = formattedMembers; // Replace the existing Map properly
    }

    // Handle attachments update if it's an array
    if (updateData.pAttachments) {
      updateData.pAttachments = { $each: updateData.pAttachments };
    }

    // Perform update
    const updatedProject = await ProjectModel.findByIdAndUpdate(
      projectId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project updated successfully", project: updatedProject });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

//Delete Project Admin
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const deletedProject = await ProjectModel.findByIdAndDelete(projectId);
   
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }

}
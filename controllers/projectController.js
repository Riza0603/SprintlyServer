import ProjectModel from "../models/Projects.js";
import TaskModel from "../models/Tasks.js";
import UserModel from "../models/User.js";
import NotificationModel from "../models/Notification.js";
import { createNotification } from "./notificationController.js";
import mongoose from "mongoose";
import { sendProjectAdditionEmail, sendProjectRemovalEmail } from "../services/emailService.js";;

//create a new project
export const createProject = async (req, res) => {
  const { pname, pdescription, projectCreatedBy, pstart, pend, members } = req.body;

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

    const project = await ProjectModel.create({ pname, pdescription, projectCreatedBy, pstart, pend, members: membersMap });

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


//fetches projects by
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
export const getProjectByName=async(req,res)=>{
  try{
    
    const {projectTitle}=req.params;
    const project= await ProjectModel.findOne({pname:projectTitle});
    res.status(200).json(project)
    }catch(err){
      res.status(500).json({message:"Error in getProjectByName()"},err)
  }
}


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

//aws updateProject
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


//remove member from project
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
    await sendProjectRemovalEmail(user,projectName);
    res.status(200).json({ message: "Member deleted successfully and email sent" });
  } catch (err) {
    console.error("Error deleting member:", err);
    res.status(500).json({ message: "Error deleting member", error: err.message });
  }
};


//add members to project
export const addMember = async (req, res) => {
  try {
    const { _id, projectName, position } = req.body;

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

    await sendProjectAdditionEmail([member.email], projectName, project.pdescription, project.pstart, project.pend);

    res.status(200).json(member);
  } catch (err) {
    res.status(500).json({ message: "Error adding member", error: err.message });
  }
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
export const fetchDetails = async (req, res) => {
  try {
    const { pname } = req.query;

    const users = await UserModel.find({ projects: pname });
    if (!users || users.length === 0) return res.status(404).json({ message: "Project not found" });

    const memberNames = users.map((user) => user.name);

    const tasks = await TaskModel.find({ assignee: { $in: memberNames }, projectName: pname });

    // Edge case: No tasks found
    if (tasks.length === 0) {
      return res.json({
        projectName: pname,
        members: users.map((user) => ({
          id: user._id,
          name: user.name,
          workload: 0,
          workloadPercentage: 0,
        })),
      });
    }

    const totalTasks = tasks.length; 
    let totalWeightSum = 0; 

    const workloadData = users.map((user) => {
      const userTasks = tasks.filter((task) => task.assignee === user.name);

      const workloadScore = userTasks.reduce((total, task) => {
        const priorityWeight = task.priority === "High" ? 3 : task.priority === "Medium" ? 2 : 1;
        return total + priorityWeight;}, 0);

      const weight = totalTasks > 0 ? workloadScore / totalTasks : 0;
      totalWeightSum += weight;

      return { id: user._id, name: user.name, workloadScore, weight };
    });

    const finalWorkloadData = workloadData.map((member) => {
      const workloadPercentage = totalWeightSum > 0 ? Math.round((member.weight / totalWeightSum) * 100) : 0;

      return { 
        id: member.id, 
        name: member.name, 
        workload: member.workloadScore, 
        workloadPercentage: parseFloat(workloadPercentage)
      };
    });

    finalWorkloadData.sort((a, b) => b.workloadPercentage - a.workloadPercentage);

    res.json({ projectName: pname, members: finalWorkloadData });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
};

//get projrct name by creator id
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

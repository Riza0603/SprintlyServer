import ProjectModel from "../models/Projects.js";
import TaskModel from "../models/Tasks.js";
import UserModel from "../models/User.js";
import NotificationModel from "../models/Notification.js";
import { createNotification } from "./notificationController.js";
//project creation
export const createProject = async (req, res) => {
  const { pname, pdescription,projectCreatedBy, pstart, pend,members } = req.body;

  if (!pname || !pdescription || !pstart || !pend) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    // Check if a project with the same name already exists 
    const existingProject = await ProjectModel.findOne({ pname });
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
       position: "Employee",
     };
   });

   
    const project = await ProjectModel.create({ pname, pdescription,projectCreatedBy, pstart, pend , members:membersMap });

    //add project to user table
    await Promise.all(
      members.map(async (memberId) => {
        await UserModel.findByIdAndUpdate(
          memberId,
          { $addToSet: { projects: pname } }, 
          { new: true }
        );
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

    return res.status(201).json({
      message: "Project created successfully",
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


//get members
export const getMembers=async(req,res)=>{
  try{
    const projName=req.params.projectName;
    const members=await UserModel.find({projects:projName})
    
    res.status(200).json(members)
  }catch(error){
    console.log("error in getMembers",error.message)
    res.status(500).json({ message: error.message });
  }
}

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

    // Remove project reference from the user
    const updateMember = await UserModel.findOneAndUpdate(
      { _id: memberId },
      { $pull: { projects: projectName } }
    );

    if (!updateMember) {
      return res.status(404).json({ message: "User not found in database" });
    }

    // Check if updateProject._id exists
    if (!updateProject._id) {
      return res.status(500).json({ message: "Project ID is missing, cannot create notification." });
    }

    // Log to debug
    console.log("Creating notification for removal:", {
      user_id: memberId,
      entity_id: updateProject._id,
    });

    // Create a notification for the removed member
    await NotificationModel.create({
      user_id: memberId,
      type: "ProjectRemoval",
      message: `You have been removed from the project: ${projectName}`,
      entity_id: updateProject._id, 
      metadata: {
        projectName: projectName,
        removedBy: removedBy || "System",
      },
      is_read: false,
      created_at: new Date(),
    });

    res.status(200).json({ message: "Member deleted successfully" });
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

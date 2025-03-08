import mongoose from "mongoose";
import UserModel from "../models/User.js";
import dotenv from "dotenv";
import TaskModel from "../models/Tasks.js";
import ProjectModel from "../models/Projects.js";

dotenv.config();


// Fetch all users
export const getAllUsers = async (req, res) => { 
  try {
    const users = await UserModel.find({}, "-password -__v"); // Exclude passwords for security
    const userCount = users.length;
    res.status(200).json({ success: true, users, userCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
};


// Fetching all Projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.find(); 
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching projects", error: error.message });
  }
};

// Fetching Counts of Ongoing and Completed Projects
export const getProjectCounts = async (req, res) => {
  try {
      
      const totalProjectsCount = await ProjectModel.countDocuments();
      const ongoingProjectsCount = await ProjectModel.countDocuments({ pstatus: 'In-Progress' });
      const completedProjectsCount = await ProjectModel.countDocuments({ pstatus: 'completed' });

      // Send the counts as JSON response
      res.status(200).json({
          totalProjectsCount,
          ongoingProjectsCount,
          completedProjectsCount,
      });
  } catch (err) {
      res.status(500).json({ message: "Error retrieving project counts", error: err.message });
  }
};

export const getProjectProgress = async (req, res) => {
  try {
    const { projectName } = req.body;

    if (!projectName) {
      return res.status(400).json({ message: "Project name is required" });
    }

    // Find all tasks related to this project
    const totalTasks = await TaskModel.countDocuments({ projectName });
    if (totalTasks === 0) {
      return res.status(200).json({ message: "No tasks found for this project", progressPercentage: 0 });
    }

    // Count completed tasks
    const completedTasks = await TaskModel.countDocuments({ projectName, status: "Completed" });

    // Calculate progress percentage
    const progressPercentage = (completedTasks / totalTasks) * 100;

    res.status(200).json({
      projectName,
      totalTasks,
      completedTasks,
      progressPercentage: progressPercentage.toFixed(2) + "%",
    });

  } catch (error) {
    res.status(500).json({ message: "Error calculating project progress", error: error.message });
  }
};

// give list of assigned user by project name and unassigned users also

export const getUsersByProject = async (req, res) => { 
  try {
    const { projectName } = req.body; 

    if (!projectName) {
      return res.status(400).json({ success: false, message: "Project name is required in the request body" });
    }

  
    const assignedUsers = await UserModel.find({ projects: projectName }, "-password -__v").lean();  //.lean() converts a Mongoose document into a plain JavaScript object.
    const assignedUserCount = assignedUsers.length;

    res.status(200).json({ 
      success: true, 
      data: {
        projectName,
        assignedUserCount,
        assignedUsers,
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching users by project", 
      error: error.message 
    });
  }
};

export const getUnassignedUsers = async(req, res) => {
  try {
    const unAssignedUsers = await UserModel.find({projects : {$size:0}},"-password -__v").lean();
    const unAssignedUsersCount = unAssignedUsers.length;

    res.status(200).json({
      success:true,
      data:{
        unAssignedUsers,
        unAssignedUsersCount
      }
    })
    
  } catch (error) {
    res.status(500).json({
      success:false,
      message:"error finding unassigned user details",
      error:error.message
    });
    
  }
};



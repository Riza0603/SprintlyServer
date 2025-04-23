import mongoose from "mongoose";

import dotenv from "dotenv";
import TaskModel from "../models/Tasks.js";
import ProjectModel from "../models/Projects.js";
import UserModel from "../models/User.js"; 
import Notification from "../models/Notification.js";
import RequestModel from "../models/Requests.js";
import TempTimeModel from "../models/TempTime.js";
import TimeSheetModel from "../models/TimeSheets.js";
import { deleteFilesFromS3 } from "../config/S3functions.js";

dotenv.config();

//Fetch all users - not needed already there in authController.js
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({}, "-password"); // Exclude passwords for security
    res.status(200).json({ success: true, users });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false, 
        message: "Error fetching users",
        error: error.message,
      });
  }
};
// Fetch all users
export const deleteProjectAdmin = async (req, res) => {
  try {
    const { projectID } = req.params;
    console.log(projectID);
    if (!projectID) {
      return res
        .status(400)
        .json({ success: false, message: "Project ID not provided" });
    }
    // Fetch project details
    const project = await ProjectModel.findById(projectID);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const projectName = project.pname;
    console.log(projectName);
    let fileUrlsToDelete = [...(project.pAttachments || [])];
    // Fetch tasks to delete associated files from task comments
    const tasks = await TaskModel.find({ projectName });
    tasks.forEach((task) => {
      task.comments.forEach((comment) => {
        if (comment.attachments?.length) {
          fileUrlsToDelete.push(...comment.attachments);
        }
      });
    });

    try{
    // First, delete the files from S3
    if (fileUrlsToDelete.length > 0) {
      const fileNamesArray = fileUrlsToDelete.map((url) =>
        Array.isArray(url) ? url : [url]  // Wrap each url in an array if it's not already an array
      );
      console.log(fileNamesArray);

      const deletePromises = fileNamesArray.map((fileUrl) =>

        deleteFilesFromS3(fileUrl) // Assume deleteFilesS3 is a function that handles file deletion from S3
      );

      // Wait for all file deletions to complete
      await Promise.all(deletePromises);
      console.log("all files related to this have been delted",fileUrlsToDelete);
    }
  }
  catch {console.log("error deleteing files");
    return res
    .status(404)
    .json({ success: false, message: "fiole sdfsdfn not deltedddddd" });  }

    // Now, delete the project from all collections
    await Promise.all([
      RequestModel.deleteMany({ projectID }),
      TaskModel.deleteMany({ projectName }),
      TempTimeModel.deleteMany({ projectName }),
      TimeSheetModel.updateMany(
        { "timeSheet.projectsHours.projectName": projectName },
        { $pull: { "timeSheet.$[].projectsHours": { projectName } } }
      ),
      UserModel.updateMany({}, { $pull: { projects: projectName } }),
      ProjectModel.findByIdAndDelete(projectID), // Delete the project itself
    ]);

    return res
      .status(200)
      .json({
        success: true,
        message: "Project and associated data deleted successfully",
      });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


// Fetching all Projects
export const getAllProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.find();
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching projects",
        error: error.message,
      });
  }
};

// Fetching Counts of Ongoing and Completed Projects
export const getProjectCounts = async (req, res) => {
  try {
    const totalProjectsCount = await ProjectModel.countDocuments();
    const ongoingProjectsCount = await ProjectModel.countDocuments({
      pstatus: "In-Progress",
    });
    const completedProjectsCount = await ProjectModel.countDocuments({
      pstatus: "Completed",
    });
    const totalUsersCount = await UserModel.countDocuments();
    const result = await ProjectModel.aggregate([
      {
        $project: {
          membersArray: { $objectToArray: "$members" }
        }
      },
      {
        $unwind: "$membersArray"
      },
      {
        $match: {
          "membersArray.v.position": "Project Manager"
        }
      },
      {
        $group: {
          _id: "$membersArray.k" // Group by the member's ObjectId string
        }
      },
      {
        $count: "uniqueManagers"
      }
    ]);
    
    const uniqueManagerCount = result[0]?.uniqueManagers || 0;
    const admins = await UserModel.countDocuments({
      adminAccess: true,
    });   
    const adReqCount = await RequestModel.countDocuments({
      reqType: "ADMIN_ACCESS" ,
    });  

    const totalReqCount = await RequestModel.countDocuments();

    const projDelReqCount = await RequestModel.countDocuments({
      reqType: "PROJECT_DELETION",
    });
    // Send the counts as JSON response
    res.status(200).json({
      totalProjectsCount,
      ongoingProjectsCount,
      completedProjectsCount,
      totalUsersCount,
      uniqueManagerCount,
      admins,
      adReqCount,
      projDelReqCount,
      totalReqCount,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error retrieving project counts", error: err.message });
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
      return res
        .status(200)
        .json({
          message: "No tasks found for this project",
          progressPercentage: 0,
        });
    }

    // Count completed tasks
    const completedTasks = await TaskModel.countDocuments({
      projectName,
      status: "Completed",
    });

    // Calculate progress percentage
    const progressPercentage = (completedTasks / totalTasks) * 100;

    res.status(200).json({
      projectName,
      totalTasks,
      completedTasks,
      progressPercentage: progressPercentage.toFixed(2) + "%",
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error calculating project progress",
        error: error.message,
      });
  }
};

// give list of assigned user by project name and unassigned users also

export const getUsersByProject = async (req, res) => {
  try {
    const { projectName } = req.body;

    if (!projectName) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Project name is required in the request body",
        });
    }

    const assignedUsers = await UserModel.find(
      { projects: projectName },
      "-password -__v"
    ).lean(); //.lean() converts a Mongoose document into a plain JavaScript object.
    const assignedUserCount = assignedUsers.length;

    res.status(200).json({
      success: true,
      data: {
        projectName,
        assignedUserCount,
        assignedUsers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users by project",
      error: error.message,
    });
  }
};

export const getUnassignedUsers = async (req, res) => {
  try {
    const unAssignedUsers = await UserModel.find(
      { projects: { $size: 0 } },
      "-password -__v"
    ).lean();
    const unAssignedUsersCount = unAssignedUsers.length;

    res.status(200).json({
      success: true,
      data: {
        unAssignedUsers,
        unAssignedUsersCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "error finding unassigned user details",
      error: error.message,
    });
  }
};

// Fetching all projects with their details for admin dashboard
export const getadminProjectDetails = async (req, res) => {
  try {
    const projects = await ProjectModel.find();

    const kpiData = await Promise.all(
      projects.map(async (project) => {
        const managerId = project.projectCreatedBy;
        const projectManager = await UserModel.findById(managerId);

        const statusData = await TaskModel.aggregate([
          { $match: { projectName: project.pname } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 }
            }
          }
        ]);

        let noProgress = 0,
          inProgress = 0,
          completed = 0;

        statusData.forEach((s) => {
          if (s._id === "No Progress") noProgress = s.count;
          else if (s._id === "In-Progress") inProgress = s.count;
          else if (s._id === "Completed") completed = s.count;
        });

        const total = noProgress + inProgress + completed;

        const completionPercentage =
          total > 0
            ? Math.round(
                (noProgress * 0 + inProgress * 50 + completed * 100) / total
              )
            : 0;

        return {
          projectName: project.pname,
          projectManager: projectManager?.name || "Unknown",
          totalTeamMembers: Object.keys(project.members || {}).length,
          totalTasks: total,
          completionPercentage
        };
      })
    );

    res.json(kpiData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};



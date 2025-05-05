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
    .json({ success: false, message: "files not deleted !!!!!" });  }

    // Now, delete the project from all collections
    await Promise.all([
      //Notification.deleteMany({ "metadata.projectName": projectName }),
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




// Fetching Counts of Ongoing and Completed Projects
export const getProjectCounts = async (req, res) => {
  try {
    const totalProjectsCount = await ProjectModel.countDocuments();
    const ongoingProjectsCount = await ProjectModel.countDocuments({
      pstatus:  { $ne: 'Completed' },
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

        const completionPercentage = total > 0 ? Math.round((noProgress * 0 + inProgress * 50 + completed * 100) / total): 0;

        return {
          projectName: project.pname,
          startDate:project.pstart,
          endDate:project.pend,
          pstatus:project.pstatus,
          projectManager: projectManager?.name || "Unknown",
          totalTeamMembers: project.members?.size || 0,
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


export const addUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      reportTo,
      experience,
      projects,
    } = req.body;

    // Ensure all required fields are present
    if (
      !name ||
      !email ||
      !phone ||
      !role ||
      !reportTo ||
      !experience 
        ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const newUser = new UserModel({
      name,
      email,
      phone,
      role,
      reportTo,
      experience,
      projects,
      password: "Ankit1234@",
      isVerified: true,
    });

    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Error adding user:", error);
    if (error.name === "ValidationError") {
      res
        .status(400)
        .json({
          success: false,
          message: "Validation error",
          details: error.message,
        });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
};

// Delete a user

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userID = id; // Assuming the ID is passed as a parameter
    const userExists = await UserModel.findById(userID);
    if (!userExists) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    let fileUrlsToDelete = [];
    const tasks = await TaskModel.find({
      $or: [
        { assigneeId: userID },
        { createdById: userID },
        { "comments.userId": userID },
      ],
    });
    tasks.forEach((task) => {
      task.comments.forEach((comment) => {
        if (comment.attachments?.length) {
          fileUrlsToDelete.push(...comment.attachments);
        }
      });
    });
    try {
      // First, delete the files from S3
      if (fileUrlsToDelete.length > 0) {
        const fileNamesArray = fileUrlsToDelete.map(
          (url) => (Array.isArray(url) ? url : [url]) // Wrap each url in an array if it's not already an array
        );

        const deletePromises = fileNamesArray.map(
          (fileUrl) => deleteFilesFromS3(fileUrl) // Assume deleteFilesS3 is a function that handles file deletion from S3
        );

        // Wait for all file deletions to complete
        await Promise.all(deletePromises);
       
      }
    } catch {
      console.log("error deleteing files");
      return res
        .status(404)
        .json({ success: false, message: "fiole sdfsdfn not deltedddddd" });
    }

    // Remove references from other collections
    await Promise.all([
      Notification.deleteMany({ user_id: userID }),
      ProjectModel.updateMany({}, { $unset: { [`members.${userID}`]: 1 } }),
      ProjectModel.updateMany(
        { projectCreatedBy: userID },
        { $set: { projectCreatedBy: null } }
      ),
      RequestModel.deleteMany({ userID }),
      TaskModel.updateMany(
        { assigneeId: userID },
        { $set: { assignee: "NA", assigneeId: null } }
      ),
      TaskModel.updateMany(
        { createdById: userID },
        { $set: { createdBy: "NA", createdById: null } }
      ),
      TaskModel.updateMany({}, { $pull: { comments: { userId: userID } } }),
      TempTimeModel.deleteMany({ userId: userID }),
      TimeSheetModel.deleteMany({ userId: userID }),
    ]);

    // Delete user from UserModel
    await UserModel.findByIdAndDelete(userID);

        
    // Remove the request itself
    await RequestModel.deleteMany({ targetUserID: userID });

    return res
      .status(200)
      .json({
        success: true,
        message: "User deleted successfully and references removed.",
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


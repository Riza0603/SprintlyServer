import User from "../models/User.js";
import RequestModel from "../models/Requests.js";
import UserModel from "../models/User.js";
import ProjectModel from "../models/Projects.js";
import Notification from "../models/Notification.js";
import TaskModel from "../models/Tasks.js";
import TempTimeModel from "../models/TempTime.js";
import TimeSheetModel from "../models/TimeSheets.js";
import argon2 from "argon2";
import { deleteFilesFromS3 } from "../config/S3functions.js";

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
      password,
    } = req.body;

    // Ensure all required fields are present
    if (
      !name ||
      !email ||
      !phone ||
      !role ||
      !reportTo ||
      !experience ||
      !password
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const newPass = await argon2.hash(password);

    const newUser = new User({
      name,
      email,
      phone,
      role,
      reportTo,
      experience,
      projects,
      password: newPass,
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
        console.log(
          "all files related to this have been delted",
          fileUrlsToDelete
        );
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

// Update a user
export const updateUser = async (req, res) => {
  try {
    const {
      _id,
      name,
      email,
      phone,
      role,
      experience,
      reportTo,
      projects,
      password,
    } = req.body;
    const newPass = await argon2.hash(password);
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        name,
        email,
        phone,
        role,
        experience,
        reportTo,
        projects,
        password: newPass,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Fetch all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select(
      "name email experience role reportTo projects"
    );
    console.log("Fetched users:", users); // Log the fetched users
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error); // Log the error
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

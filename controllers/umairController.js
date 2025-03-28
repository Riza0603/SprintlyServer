import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Project from "../models/Projects.js";
import Task from "../models/Tasks.js";
import TempTime from "../models/TempTime.js";
import Timesheet from "../models/TimeSheets.js";


export const addUser = async (req, res) => {
  try {
    const { name, email, phone, role, reportTo, experience, projects, password } = req.body;

    // Ensure all required fields are present
    if (!name || !email || !phone || !role || !reportTo || !experience || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const newUser = new User({
      name,
      email,
      phone,
      role,
      reportTo,
      experience,
      projects,
      password,
      isVerified: true,
    });

    await newUser.save();
    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Error adding user:", error);
    if (error.name === 'ValidationError') {
      res.status(400).json({ success: false, message: "Validation error", details: error.message });
    } else {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
};



// Delete a user

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = id; // Assuming the ID is passed as a parameter

    // Start a session to ensure atomicity
    const session = await User.startSession();
    session.startTransaction();

    try {
      // Delete the user
      const user = await User.findByIdAndDelete(userId, { session });
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Delete related notifications
      await Notification.deleteMany({ user_id: userId }, { session });

      // Remove the user from projects
      const projects = await Project.find({ "members._id": userId }, { session });
      for (const project of projects) {
        delete project.members[userId];
        await project.save({ session });
      }

      // Delete related tasks
      await Task.deleteMany({ assigneeId: userId }, { session });

      // Delete related temp times
      await TempTime.deleteMany({ userId: userId }, { session });

      // Delete related timesheets
      await Timesheet.deleteMany({ userId: userId }, { session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      res.json({ success: true, message: "User and related data deleted successfully" });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error deleting user and related data:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update a user
export const updateUser = async (req, res) => {
  try {
    const { _id, name, email, phone, role, experience, reportTo, projects, password } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { name, email, phone, role, experience, reportTo, projects, password },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
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
    const users = await User.find().select("name email experience role reportTo projects");
    console.log("Fetched users:", users); // Log the fetched users
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error); // Log the error
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

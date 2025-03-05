import mongoose from "mongoose";
import UserModel from "../models/User.js";
import dotenv from "dotenv";
import ProjectModel from "../models/Projects.js";

dotenv.config();


/*Fetch all users - not needed already there in authController.js
export const getAllUsers = async (req, res) => { 
  try {
    const users = await UserModel.find({}, "-password"); // Exclude passwords for security
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
};*/

// Fetching Counts of Ongoing and Completed Projects
export const getProjectCounts = async (req, res) => {
  try {
      
      const ongoingProjectsCount = await ProjectModel.countDocuments({ pstatus: 'In-Progress' });
      const completedProjectsCount = await ProjectModel.countDocuments({ pstatus: 'completed' });

      // Send the counts as JSON response
      res.status(200).json({
          ongoingProjectsCount,
          completedProjectsCount,
      });
  } catch (err) {
      res.status(500).json({ message: "Error retrieving project counts", error: err.message });
  }
};

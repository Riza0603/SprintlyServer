import mongoose from "mongoose";
import UserModel from "../models/User.js";
import dotenv from "dotenv";
import ProjectModel from "../models/Projects.js";

dotenv.config();


// Fetch all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({}, "-password"); // Exclude passwords for security
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
};



export const getAllProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.find(); 
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching projects", error: error.message });
  }
};




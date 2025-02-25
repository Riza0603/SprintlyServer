import ProjectModel from "../models/Projects.js";
import mongoose from "mongoose";



export const getAllProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.find(); 
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching projects", error: error.message });
  }
};




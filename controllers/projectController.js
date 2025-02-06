import ProjectModel from "../models/Projects.js";
import mongoose from "mongoose";

export const createProject = async (req, res) => {
  const { pname, pdescription, pstart, pend,members } = req.body;

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
    const formattedMembers = members
      ? members.map((name) => ({ _id: new mongoose.Types.ObjectId(), name }))
      : [];

    // Create the new project
    const project = await ProjectModel.create({ pname, pdescription, pstart, pend , members: formattedMembers});

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


export const fetchProjects = async (req, res) => {
  try {
    const projects = await ProjectModel.find();
    res.status(200).json(projects);
  } catch (err) {
    console.error("Error in fetchProjects:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// New function to fetch only project id and name
export const fetchProjectNames = async (req, res) => {
  try {
    const projects = await ProjectModel.find({}, "_id pname"); // Fetch only _id and pname

    // Format response
    const formattedProjects = projects.map((project) => ({
      id: project._id,
      name: project.pname,
    }));

    res.status(200).json(formattedProjects);
  } catch (err) {
    console.error("Error in fetchProjectNames:", err.message);
    res.status(500).json({ message: err.message });
  }
};



// Update global notification settings
export const updateGlobalSettings = async (req, res) => {
  const { notifyInApp, notifyEmail } = req.body;

  try {
    // Update all projects' settings in bulk
    await ProjectModel.updateMany({}, { notifyinApp: notifyInApp, notifyemail: notifyEmail });

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
  const { notifyInApp, notifyEmail } = req.body;

  try {
    const updatedProject = await ProjectModel.findByIdAndUpdate(
      projectId,
      { notifyinApp: notifyInApp, notifyemail: notifyEmail },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
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


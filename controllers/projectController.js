import ProjectModel from "../models/Projects.js";

export const createProject = async (req, res) => {
  const { pname, pdescription, pstart, pend } = req.body;

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

    // Create the new project
    const project = await ProjectModel.create({ pname, pdescription, pstart, pend });

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

const ProjectModel = require('../models/Projects');

const createProject = async (req, res) => {
  const { pname, pdescription, pstart, pend } = req.body;

  // Validate input before creating a project
  if (!pname || !pdescription || !pstart || !pend) {
      return res.status(400).json({ message: 'All fields are required' });
  }

  try {
      // Create a new project
      const project = await ProjectModel.create({ pname, pdescription, pstart, pend });

      // Return the created project with a success message
      return res.status(201).json({
          message: 'Project created successfully',
          project,
      });
  } catch (error) {
      // Log the error and send a user-friendly response
      console.error('Error creating project:', error);
      return res.status(500).json({
          message: 'Error creating project',
          error: error.message,
      });
  }
};


module.exports = { createProject };

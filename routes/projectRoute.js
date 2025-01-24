const express = require('express');
const router = express.Router();
const ProjectModel = require('../models/Projects');
const { createProject } = require('../controllers/projectController'); // Import controller


router.post("/createProject", createProject);

module.exports = router;
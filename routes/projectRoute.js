const express = require('express');
const router = express.Router();
const ProjectModel = require('../models/Projects');
const ProjectContoller = require('../controllers/projectController'); 


router.post("/createProject", ProjectContoller.createProject);
router.get("/fetchProject",ProjectContoller.fetchProjects);
module.exports = router;
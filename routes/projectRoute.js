const express = require('express');
const router = express.Router();
const ProjectModel = require('../models/Projects');
const ProjectContoller = require('../controllers/projectController'); 


router.post("/createProject", ProjectContoller.createProject);

module.exports = router;
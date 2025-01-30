const express = require("express");
const TaskController = require("../controllers/taskControllers");
const router = express.Router();

// Task Routes
router.post("/tasks", TaskController.addTask); // Add Task
router.get("/tasks", TaskController.getTasks); // Fetch Tasks

module.exports = router;

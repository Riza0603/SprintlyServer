import express from "express";
import { addTask, getTasks } from "../controllers/taskController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
const router = express.Router();

// Task Routes
router.post("/tasks", addTask); // Add Task
router.get("/tasks", getTasks); // Fetch Tasks

export default router;

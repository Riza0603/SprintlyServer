import express from "express";
import { addComment, addTask, getComments, getTasks, updateStatus } from "../controllers/taskController.js";

const router = express.Router();

// Task Routes
router.post("/tasks", addTask); // Add Task
router.get("/tasks", getTasks); // Fetch Tasks
router.post("/addComment/:taskId",addComment);//add comments
router.post("/getComments/:taskId",getComments);
router.post("/updateStatus",updateStatus)
export default router;

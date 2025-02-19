import express from "express";
import { addComment, addTask, deleteComment, fetchTask, getComments, getTasks, updateStatus } from "../controllers/taskController.js";

const router = express.Router();

// Task Routes
router.post("/tasks", addTask); // Add Task
router.get("/tasks", getTasks); // Fetch Tasks
router.post("/addComment/:taskId",addComment);//add comments
router.delete("/deleteComment/:taskId/:commentId",deleteComment);
router.post("/getComments/:taskId",getComments);
router.post("/updateStatus",updateStatus)
router.get("/tasks/:projectName", fetchTask); // Fetch Tasks by Project Name
export default router;

import express from "express";
import { addComment, addsubTask, addTask, deleteComment, deleteSubTask, getComments, getSubTasks, getTasks, updateStatus } from "../controllers/taskController.js";

const router = express.Router();

// Task Routes
router.post("/tasks", addTask); // Add Task
router.get("/tasks", getTasks); // Fetch Tasks
router.post("/addComment/:taskId",addComment);//add comments
router.delete("/deleteComment/:taskId/:commentId",deleteComment);
router.post("/getComments/:taskId",getComments);
router.post("/updateStatus",updateStatus);
router.post("/addSubTask/:taskId",addsubTask);
router.post("/getSubTasks/:taskId",getSubTasks);
router.delete("/deleteSubTask/:taskId/:subTaskId",deleteSubTask);
export default router;

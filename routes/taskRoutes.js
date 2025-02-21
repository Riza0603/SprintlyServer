import express from "express";
import { addComment, addsubTask, addTask, deleteComment, deleteSubTask, getComments, getSubTasks, getTasks, importTasks, updateStatus, updateSubTask, updateSubTaskStatus, updateTask } from "../controllers/taskController.js";

const router = express.Router();

// Task Routes
router.post("/tasks", addTask); // Add Task
router.get("/tasks", getTasks); // Fetch Tasks
router.post("/editTask/:taskId",updateTask);//edit task
router.post("/addComment/:taskId",addComment);//add comments
router.delete("/deleteComment/:taskId/:commentId",deleteComment);
router.post("/getComments/:taskId",getComments);
router.post("/updateStatus",updateStatus);
router.post("/addSubTask/:taskId",addsubTask);
router.post("/getSubTasks/:taskId",getSubTasks);
router.delete("/deleteSubTask/:taskId/:subTaskId",deleteSubTask);
router.post("/editSubtask/:taskId/:subTaskId",updateSubTask);
router.post("/updateSubTaskStatus/:subTaskId",updateSubTaskStatus);
router.post("/importTasks",importTasks);
export default router;

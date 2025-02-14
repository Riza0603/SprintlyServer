import mongoose from "mongoose";
import TaskModel from "../models/Tasks.js";

// Add Task API
export const addTask = async (req, res) => {
  try {
    const taskData = {
      title: req.body.title,
      description: req.body.description,
      projectName: req.body.projectName || "None",
      assignee: req.body.assignee || "Unassigned",
      assigneeId: req.body.assigneeId,
      status: req.body.status || "No Progress",
      priority: req.body.priority || "None",
      createdBy:req.body.createdBy|| "None",
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      createdBy: req.body.createdBy || null,
      comments: req.body.comments || [],
    };

    // Save Task
    const task = new TaskModel(taskData);
    await task.save();

    res.status(201).json(task); // Return the saved task
  } catch (err) {
    console.error("Error in addTask:", err.message);
    res.status(400).json({ message: err.message });
  }
};

// Fetch Tasks API
export const getTasks = async (req, res) => {
  try {
    const tasks = await TaskModel.find(); // Fetch all tasks
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Error in getTasks:", err.message);
    res.status(500).json({ message: err.message });
  }
};


//add comment
export const addComment=async(req,res)=>{
  try{
    const {taskId}=req.params;
    
    const {userId,username,text}=req.body;
    if (!username || !text) {
      return res.status(400).json({ message: "Username and text are required." });
  }
  const newComment={
    _id:new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userId),
    username,
    text,
    
  };
  
  

  await TaskModel.updateOne(
    { _id: taskId },
    { $push: { comments: newComment } }
  );

  
  res.status(201).json({ message: "Comment added successfully" });


  }catch(error){
    res.status(500).json({ message: "Server error", error: error.message });

  }
}

//fetch comments
export const getComments=async(req,res)=>{
  try{
    const {taskId}=req.params;
    const tasks= await TaskModel.findById(taskId)
    res.status(200).json(tasks.comments)

  }catch(error){
    console.log("error in getComments",error.message)
    res.status(500).json({message:error.message});
  }
}

export const updateStatus=async(req,res)=>{
  try {
    const { taskId, status } = req.body;
    if (!taskId || !status) {
      return res.status(400).json({ message: "Task ID and status required" });
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, { status }, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task status updated", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Server error" });
  }
}


export const deleteComment = async (req, res) => {
  const { taskId, commentId } = req.params; // Expect taskId to find the task
  try {
    const updateTask = await TaskModel.findOneAndUpdate(
      { _id: taskId }, // Find the task by taskId, not commentId
      { $pull: { comments: { _id: commentId } } }, // Remove the comment from the comments array
      { new: true } // Return updated document
    );

    if (!updateTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting comment", error: err });
  }
};

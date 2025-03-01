import mongoose, { trusted } from "mongoose";
import TaskModel from "../models/Tasks.js";
import UserModel from "../models/User.js";
import ProjectModel from "../models/Projects.js";
import { sendTaskAssignmentEmail, sendTaskUpdateEmail } from "../services/emailService.js";

// Add Task API
export const addTask = async (req, res) => {
  try {
    const { title, description, projectName, assignee, assigneeId, status, priority, createdBy, createdById, startDate, endDate, completedOn, comments, visibility } = req.body;

    const taskData = {
      title,
      description,
      projectName: projectName || "None",
      assignee: assignee || "Unassigned",
      assigneeId,
      status: status || "No Progress",
      priority: priority || "Low",
      createdBy,
      createdById,
      startDate: startDate || null,
      endDate: endDate || null,
      visibility: visibility || "public",
      completedOn: completedOn || null,
      comments: comments || [],
    };

    const task = new TaskModel(taskData);
    await task.save();

    const project = await ProjectModel.findOne({pname: projectName});
    if (project && project.members.has(assigneeId) && project.members.get(assigneeId).notifyinEmail)     {
      const user = await UserModel.findById(assigneeId);
      if (user) {
        await sendTaskAssignmentEmail(user, project, title, description, startDate, endDate, priority, createdBy);
      }
    }

    res.status(201).json({ message: "Task created successfully and email sent", task });
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
    
    const {username,text,userId}=req.body;
    if (!username || !text) {
      return res.status(400).json({ message: "Username and text are required." });
  }
  const newComment={
    _id:new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(userId),
    username:username,
    text,
  };
  console.log(newComment)
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


//toggle between in-progress and completed
export const updateStatus=async(req,res)=>{
  try {
    const { taskId, status } = req.body;
    if (!taskId || !status) {
      return res.status(400).json({ message: "Task ID and status required" });
    }
    let completedOn = null;
    if (status === "Completed") {
      completedOn = new Date(); 
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, { status,completedOn}, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task status updated", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Server error" });
  }
}

//delete comment
export const deleteComment = async (req, res) => {
  const { taskId, commentId } = req.params; 
  try {
    const updateTask = await TaskModel.findOneAndUpdate(
      { _id: taskId }, 
      { $pull: { comments: { _id: commentId } } }, 
      { new: true } 
    );

    if (!updateTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting comment", error: err });
  }
};



//add subtask
export const addsubTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;


    const newSubTask = {
      _id: new mongoose.Types.ObjectId(),
      title,
    };

    const updateFields = {
      $push: { subTasks: newSubTask },
    };

    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    //change to no progress when a subtask is added
    if (task.subTasks.length === 0) {
      updateFields.$set = { status: "No Progress" };
    }
    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, updateFields, { new: true });
    res.status(200).json({ message: "Subtask added successfully", updatedTask });
  } catch (error) {
    console.error("Error adding subtask:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



export const getSubTasks= async(req,res)=>{
  try{
    const {taskId}=req.params;
    const tasks= await TaskModel.findById(taskId)
    res.status(200).json(tasks.subTasks)
  }catch(error){
    res.status(500).json({message:"Server error in getSubTasks()",error:error.message})
  }
}

export const deleteSubTask= async(req,res)=>{
  try{
    const {taskId,subTaskId}=req.params;
    const updateTask=await TaskModel.findOneAndUpdate(
      {_id:taskId},
      {$pull:{subTasks:{_id:subTaskId}}},
      {new:true}
    )
    
    if(!updateTask){
      return res.status(404).json({message:"Task not found"})
    }
    res.status(200).json({message:"Subtask deleted successfully"})
  }
  catch(error){
    res.status(500).json({message:"Server error in deleteSubTask()",error:error.message})
  }
}

export const updateSubTask= async (req,res)=>{
  try{
    const {taskId,subTaskId}=req.params;
    const {title,status}=req.body;
    
    const updateTask=await TaskModel.findOneAndUpdate(
      {_id:taskId,"subTasks._id":subTaskId},
      {$set:{"subTasks.$.title":title}},
      {new:true},

    )
    if(!updateTask){
      return res.status(404).json({message:"Task not found"})
    }
    res.status(200).json(updateSubTask);
  }catch(error){
    res.status(500).json({message:"Server error in updateSubTask()",error:error.message})
  }
}

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, assignee, assigneeId, status, priority, startDate, endDate, visibility } = req.body;

    const existingTask = await TaskModel.findById(taskId);
    if (!existingTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    const changes = {};
    for (const key of ["title", "description", "assignee", "priority", "startDate", "endDate"]) {
      const normalizeDate = (date) => (date ? new Date(date).toISOString().split("T")[0] : null);

    let oldValue = existingTask[key];
    let newValue = req.body[key];

    if (key === "startDate" || key === "endDate") {
      oldValue = normalizeDate(oldValue);
      newValue = normalizeDate(newValue);
    }

    if (newValue !== undefined && String(newValue) !== String(oldValue)) {
      changes[key] = { old: oldValue || "N/A", new: newValue || "N/A" };
    }
    }

    if (Object.keys(changes).length === 0) {
      return res.status(200).json({ message: "No changes detected" });
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      { title, description, assignee, assigneeId, status, priority, startDate, endDate, visibility },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task update failed" });
    }

    const project = await ProjectModel.findOne({ pname: updatedTask.projectName });
    if (project && project.members.has(assigneeId) && project.members.get(assigneeId).notifyinEmail) {
      const user = await UserModel.findById(assigneeId);
      if (user) {
        let changesList = Object.entries(changes)
          .map(([key, value]) => `<p><strong>${key.replace(/([A-Z])/g, " $1")}:</strong> <br> Old: ${value.old || "N/A"} <br> New: ${value.new || "N/A"}</p>`)
          .join("");
          await sendTaskUpdateEmail(user, project, title, changesList);
      }
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: "Server error in updateTask()", error: error.message });
  }
};



//update subtask status
export const updateSubTaskStatus=async(req,res)=>{
  try{
    const {subTaskId}=req.params;
    const {status}=req.body;
    const updatedTask=await TaskModel.findOneAndUpdate(
      {"subTasks._id":subTaskId},
      {$set:{"subTasks.$.status":status}},
      {new:true}
    )
    if(!updatedTask){
      return res.status(404).json({message:"Subtask not found"})
    }

    const totalSubTasks=updatedTask.subTasks.length;
    const completedSubTasksLength=updatedTask.subTasks.filter(subtask=>subtask.status==="Completed").length;
    

    if (totalSubTasks===completedSubTasksLength) {
      updatedTask.status = "Completed";
      updatedTask.completedOn=new Date();
    }else if(completedSubTasksLength>0){
      updatedTask.status="In-Progress";
    }else{
      updatedTask.status="No Progress";
    }
    await updatedTask.save();
    

    res.status(200).json(updatedTask);
  }catch(err){
    res.status(500).json({message:"Server error in updateSubTaskStatus()",error:err.message})
  }
}

export const importTasks = async (req, res) => {
  try {
    const tasks = req.body.tasks;
    const insertedTasks = await TaskModel.insertMany(tasks);  
    res.json({ importedTasks: insertedTasks });
  } catch (err) {
    console.error("Error importing tasks:", err); // Log detailed error to server console
    res.status(500).json({ message: err.message });
  }
};

// Fetch Tasks by Project Name API
export const fetchTask = async (req, res) => {
  try {
    const { projectName } = req.params;
    const tasks = await TaskModel.find({ projectName });

    // Instead of returning a 404 error, return an empty array
    res.json(tasks.length ? tasks : []);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



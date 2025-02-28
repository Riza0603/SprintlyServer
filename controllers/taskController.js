import mongoose, { trusted } from "mongoose";
import TaskModel from "../models/Tasks.js";
import axios from 'axios';
import UserModel from "../models/User.js";

// Add Task API
export const addTask = async (req, res) => {
  
  try {
    const { title, description, projectName, assignee, assigneeId, status, priority, createdBy, startDate, endDate, completedOn, comments } = req.body;

    const taskData = {
      title: req.body.title,
      description: req.body.description,
      projectName: req.body.projectName || "None",
      assignee: req.body.assignee || "Unassigned",
      assigneeId: req.body.assigneeId,
      status: req.body.status || "No Progress",
      priority: req.body.priority || "Low",
      createdBy: req.body.createdBy ,
      createdById:req.body.createdById,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      visibility: req.body.visibility || "public",
      completedOn:req.body.CompletedOn||null,
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
export const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    console.log("taskid", taskId);

    const { userId, username, text, attachments } = req.body;
    console.log("userId", userId);
    console.log("username", username);
    console.log("text", text);
    console.log("attachments", attachments);

    if (!username || !text) {
      return res.status(400).json({ message: "Username and text are required." });
    }


    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    console.log("task has been found");
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      userId: userId,
      username: username,
      text: text,
      attachments: attachments || [],
    };

    console.log("new comment has been created", newComment);

    // task.comments.push(newComment);
    // await task.save();

    await TaskModel.updateOne(
      { _id:taskId },
      { $push: { comments: newComment } }
    );


    res.status(201).json({ message: "Comment added successfully" });


  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });

  }
}

//fetch comments
export const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const tasks = await TaskModel.findById(taskId)
    res.status(200).json(tasks.comments)

  } catch (error) {
    console.log("error in getComments", error.message)
    res.status(500).json({ message: error.message });

  }
}

export const updateStatus = async (req, res) => {
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


export const deleteComment = async (req, res) => {
  const { taskId, commentId } = req.params; // Expect taskId to find the task

  console.log("coomeeent id ", commentId);
  console.log("task id", taskId);
  try {
    const task = await TaskModel.findById(taskId);
    console.log("task foundd")
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    const comment = task.comments.find((comment) => comment._id.toString() === commentId);
    console.log("comme", comment)
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const fileUrls = comment.attachments;
    console.log("thoda kaam hua");

    console.log("fileurls", fileUrls.length);


    if (fileUrls.length > 0) {
      try {
        const dataa=await axios.delete("http://localhost:5000/api/deleteFilesS3", {
          data: { fileUrls },
        });

        console.log("response data:", dataa);
      } catch (error) {
        console.error("Error deleting cont files:",);
        return res.status(500).json({ message: "Error deleting commen ffooooiles" });
      }
    }
    // else if(fileUrls == 0) {
    //   console.log(message, "files have alredy been deleted");
    // }


    console.log("delete hua h abhi update baski h mere dost")
    const updateTask = await TaskModel.findOneAndUpdate(
      { _id: taskId }, // Find the task by taskId, not commentId
      { $pull: { comments: { _id: commentId } } }, // Remove the comment from the comments array
      { new: true } // Return updated document
    );
    console.log("update bhi ho hgaya mere bhai ", updateTask);

    if (!updateTask) {
      return res.status(404).json({ message: "Task not found" });
    }



    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting comment", error: err });
  }
};




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

export const updateTask=async(req,res)=>{
  try{
    const {taskId}=req.params;
    const {title,description,assignee,assigneeId,status,priority,startDate,endDate,visibility}=req.body;
    const updatedTask=await TaskModel.findByIdAndUpdate(taskId,{title,description,assignee,assigneeId,status,priority,startDate,visibility,endDate},
      {new:true}
    )
    if(!updatedTask){
      return res.status(404).json({message:"Task not found"})
    }
    res.status(200).json(updatedTask)

  }catch(error){
    res.status(500).json({message:"Server error in updateTask()",error:error.message})
  }
}

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



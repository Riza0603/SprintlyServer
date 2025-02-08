import TaskModel from "../models/Tasks.js";

// Add Task API
export const addTask = async (req, res) => {
  try {
    const taskData = {
      title: req.body.title,
      description: req.body.description,
      projectName: req.body.projectName || "None",
      assignee: req.body.assignee || "Unassigned",
      status: req.body.status || "No Progress",
      priority: req.body.priority || "None",
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
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

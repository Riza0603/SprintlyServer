const TaskModel = require('../models/taskModel');

// Add Task API
exports.addTask = async (req, res) => {
    try {
        const taskData = {
            title: req.body.title,
            description: req.body.description,
            projectName: req.body.projectName || "None",
            assignee: req.body.assignee || "Unassigned",
            status: req.body.status || "No Progress",
            priority: req.body.priority || "None",
            startDate: req.body.startDate,
            endDate: req.body.endDate,
        };

        const task = new TaskModel(taskData);
        await task.save();

        res.status(201).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Fetch Tasks API
exports.getTasks = async (req, res) => {
    try {
        const tasks = await TaskModel.find();
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

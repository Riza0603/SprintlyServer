const TaskModel = require('../models/taskModel');

exports.createTask = async (req, res) => {
    try {
        const task = new TaskModel(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await TaskModel.find();
        res.status(200).json(tasks);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
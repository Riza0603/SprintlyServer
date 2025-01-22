const TaskModel = require('../models/taskModel');

exports.addTask = async (req, res) => {
    try {
        const task = new TaskModel(req.body);
        await task.save();
        res.status(201).json(task);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

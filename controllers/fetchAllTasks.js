const TaskModel = require('../models/taskModel');

exports.fetchAllTasks = async (req, res) => {
    try {
        const tasks = await TaskModel.find();
        res.status(200).json(tasks);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};
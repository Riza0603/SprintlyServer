const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: String,
    description: String,
    status: String, 
    createdAt: { type: Date, default: Date.now },
});

const TaskModel = mongoose.model('Task', TaskSchema);
module.exports = TaskModel;
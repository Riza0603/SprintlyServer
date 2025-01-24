const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Title field
    description: { type: String, required: true }, // Description field
    projectName: { type: String, default: "None" }, // Project name
    assignee: { type: String, default: "Unassigned" }, // Assignee
    status: { type: String, default: "No Progress" }, // Status
    priority: { type: String, default: "None" }, // Priority
    startDate: { type: Date }, // Start Date
    endDate: { type: Date }, // End Date
    createdAt: { type: Date, default: Date.now }, // Auto-set creation date
});

const TaskModel = mongoose.model('Task', TaskSchema);
module.exports = TaskModel;
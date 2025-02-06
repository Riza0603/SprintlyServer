import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  projectName: { type: String, default: "None" },
  assignee: { type: String, default: "Unassigned" },
  status: { type: String, default: "No Progress" },
  priority: { type: String, default: "None" },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  createdBy: { type: String, default: "None" },
  createdAt: { type: Date, default: Date.now },
  
  comments: [
    {
      username: { type: String, required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const TaskModel = mongoose.model("Task", TaskSchema);

export default TaskModel;

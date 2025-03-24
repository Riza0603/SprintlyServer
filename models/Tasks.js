import mongoose from "mongoose";


const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  projectName: { type: String, default: "None" },
  assignee: { type: String, default: "Unassigned" },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, default:null  },
  status: { type: String, default: "No Progress" },
  priority: { type: String, default: "Low" },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  createdBy: { type: String, default: null },
  createdById:{type: mongoose.Schema.Types.ObjectId, default:null},
  completedOn:{type:Date,default:null},
  createdAt: { type: Date, default: Date.now },
  visibility : { type: String, default:'public' },
  subTasks: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      title: { type: String, required: true },
      status: { type: String, default: "No Progress" },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
  ],
  comments: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      userId: {  type: mongoose.Schema.Types.ObjectId, required: true ,ref: "registers"}, 
      username: { type: String, required: true },
      text: { type: String, required: true },
      attachments: [{ type: String }],
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const TaskModel = mongoose.model("Task", TaskSchema);

export default TaskModel;

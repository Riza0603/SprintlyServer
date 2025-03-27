import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  type: { type: String, enum: ["Task", "Project", "Request","CommentMention","TaskUpdate","ProjectRemoval","TaskDue","ProjectDue","Timesheet"], required: true }, 
  message: { type: String, required: true }, 
  entity_id: { type: mongoose.Schema.Types.ObjectId, required: true }, 
  metadata: { type: Object, default: {} }, 
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);

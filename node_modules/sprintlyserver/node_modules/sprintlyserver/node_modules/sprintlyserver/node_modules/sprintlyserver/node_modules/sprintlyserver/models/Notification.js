import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
  type: { type: String, enum: ["Task", "Project", "Request","CommentMention","TaskUpdate","ProjectRemoval"], required: true }, 
  message: { type: String, required: true }, // Notification message
  entity_id: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID of the related task/project/request
  metadata: { type: Object, default: {} }, // Dynamic field for additional info
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);

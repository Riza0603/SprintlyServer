import mongoose from "mongoose";

const PendingUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfJoining: { type: Date, required: true }, // Keep for experience calculation
  createdAt: { type: Date, default: Date.now },
});

const PendingUser = mongoose.model("PendingUser", PendingUserSchema);
export default PendingUser;

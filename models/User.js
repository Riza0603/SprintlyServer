import mongoose from "mongoose";
import argon2 from "argon2";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String , default: "Employee"},
    experience: { type: String , default: "N/A"},
    projects: { type: [String], default: [] } ,
    reportTo: { type: String, default: "N/A" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save middleware for hashing passwords
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await argon2.hash(this.password);
  next();
});

const UserModel = mongoose.model("register", userSchema);
export default UserModel; 

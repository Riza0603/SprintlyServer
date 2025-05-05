import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone:{type:String, required:true, unique:true}, 
    password: { type: String, required: true },
    role: { type: String , default: "Employee"},
    profilePicUrl:{type: String},
    experience: { type: String , default: "N/A"},
    projects: { type: [String], default: [] } ,
    reportTo: { type: String, default: "N/A" },
    isVerified: { type: Boolean, default: false },
    adminAccess: { type: Boolean, default: false },
    dateOfJoining: { type: Date, required: true },
    highestDegree: { type: String, default: "N/A" },
  },
  { timestamps: true }
);
const UserModel = mongoose.model("registers", userSchema);
export default UserModel; 
  
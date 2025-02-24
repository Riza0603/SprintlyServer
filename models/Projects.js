import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// const MemberSchema = new mongoose.Schema({
//   name: { type: String, required: true },
// }, { _id: true }); // Enable automatic _id generation
 

// const MemberSchema = new mongoose.Schema({
//   _id: { type: mongoose.Schema.Types.ObjectId, required: true }, // Store member ID
//   name: { type: String, required: true },
//   email:{type:String,required:true},
//   position: { type: String, default: "Employee" },
// });


const ProjectSchema = new mongoose.Schema({
  pname: String,
  pdescription: String,
  pstart: Date,
  pend: Date,
  projectCreatedBy:{type:mongoose.Schema.Types.ObjectId},
  members: {type: [mongoose.Schema.Types.ObjectId],default:[] ,ref:"registers"}, 
  pstatus: { type: String, default: "In-Progress" },
  notifyinApp: { type: Boolean, default: true },
  notifyemail: { type: Boolean, default: true },
});

const ProjectModel = mongoose.model("Projects", ProjectSchema);

export default ProjectModel;

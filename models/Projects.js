import mongoose from "mongoose";

// const MemberSchema = new mongoose.Schema({
//   name: { type: String, required: true },
// }, { _id: true }); // Enable automatic _id generation
 

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position:{type:String,default:"Employee"} 
}); 

const ProjectSchema = new mongoose.Schema({
  pname: String,
  pdescription: String,
  pstart: Date,
  pend: Date,
  members: { type: [MemberSchema], default: [] },
  pstatus: { type: String, default: "In-Progress" },
  notifyinApp: { type: Boolean, default: true },
  notifyemail: { type: Boolean, default: true },
});

const ProjectModel = mongoose.model("Projects", ProjectSchema);

export default ProjectModel;
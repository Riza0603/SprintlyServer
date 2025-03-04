import mongoose from "mongoose";

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
  members: {
    type: Map, // Use a Map to store objectId as key and notify details as value
    of: new mongoose.Schema({
      notifyinApp: { type: Boolean, default: true },
      notifyinEmail: { type: Boolean, default: true },
      position : { type: String, default: "Employee" },
    }, { _id: false }) 
  },
  pstatus: { type: String, default: "In-Progress" },
});

const ProjectModel = mongoose.model("Projects", ProjectSchema);

export default ProjectModel;
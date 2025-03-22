import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  pname: String,
  pdescription: String,
  pstart: Date,
  pend: Date,
  projectCreatedBy: { type: mongoose.Schema.Types.ObjectId},
  members: {
    type: Map, // Use a Map to store objectId as key and notify details as value
    of: new mongoose.Schema({
      notifyinApp: { type: Boolean, default: true },
      notifyinEmail: { type: Boolean, default: true },
      position : { type: String, default: "Employee" },
    }, { _id: false }) 
  },
  pstatus: { type: String, default: "In-Progress" },

  pAttachments:[{ type: String }],
});

const ProjectModel = mongoose.model("Projects", ProjectSchema);

export default ProjectModel;
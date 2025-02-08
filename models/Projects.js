import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  pname: String,
  pdescription: String,
  pstart: Date,
  pend: Date,
  pstatus: { type: String, default: "In-Progress" },
  notifyinApp: { type: Boolean, default: true },
  notifyemail: { type: Boolean, default: true },
});

const ProjectModel = mongoose.model("Projects", ProjectSchema);

export default ProjectModel;

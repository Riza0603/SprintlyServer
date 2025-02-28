import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const ProjectSchema = new mongoose.Schema({
  pname: String,
  pdescription: String,
  pstart: Date,
  pend: Date,
  members: {type: [mongoose.Schema.Types.ObjectId],default:[] ,ref:"registers"}, 
  pstatus: { type: String, default: "In-Progress" },
  notifyinApp: { type: Boolean, default: true },
  notifyemail: { type: Boolean, default: true },
  pAttachments:[{ type: String }],
});

const ProjectModel = mongoose.model("Projects", ProjectSchema);

export default ProjectModel;

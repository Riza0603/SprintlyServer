import mongoose from "mongoose";

const TimeSheetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "registers" },
  timeSheet: [
    {
      date: { type: String, required: true }, // Store date as a string
      time: { type: Number, default: 0, required: true }, // Store time in milliseconds
      comment: { type: String, default: "" }, // New field for manager comments
      status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" } // New field for approval status
    }
  ]
});

const TimeSheetModel = mongoose.model("TimeSheet", TimeSheetSchema);
export default TimeSheetModel;

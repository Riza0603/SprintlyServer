import mongoose from "mongoose";

const TimeSheetSchema = new mongoose.Schema({
    userId: {type : mongoose.Schema.Types.ObjectId, required: true, ref: "registers"},
    timeSheet :[{
        date: {type: String,required: true},
        // time:{type: Number, default: 0,required: true},
        projectsHours: [
            {
                projectName: { type: String, required: true },
                time: { type: Number, required: true, default: 0 },
                comment: { type: String, default: "" }, // New field for manager comments
                status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }
            }
        ]
    }]
});

const TimeSheetModel = mongoose.model("TimeSheet", TimeSheetSchema);
export default TimeSheetModel;

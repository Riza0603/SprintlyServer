import mongoose from "mongoose";
const TimeSheetSchema = new mongoose.Schema({
    userId: {type : mongoose.Schema.Types.ObjectId, required: true, ref: "registers"},
    timeSheet :[{
        date: {type: String,required: true},
        time:{type: Number, default: 0,required: true},
        projectsHoursg: [
            {
                projectName: { type: String, required: true },
                hours: { type: Number, required: true, default: 0 }
            }
        ]
    }]
});

const TimeSheetModel = mongoose.model("TimeSheet", TimeSheetSchema);
export default TimeSheetModel;
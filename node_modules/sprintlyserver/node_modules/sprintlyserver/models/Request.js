import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registers',
        required: true
    },
    reqType: {
        type: String,
        enum: ['ADMIN_ACCESS', 'USER_ADDITION', 'PROJECT_DELETION'],
        required: true
    },
    reqStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    }
}, { timestamps: true });

const RequestModel = mongoose.model("Requests", requestSchema);

export default RequestModel;
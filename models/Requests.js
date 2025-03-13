import mongoose from "mongoose";

const requestSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'registers',
        required: true
    },
    targetUserID: {  // New field for the user to be deleted
        type: mongoose.Schema.Types.ObjectId,
        ref: "registers",
        required: function () { return this.reqType === "USER_DELETION"; } // Required only for user deletion
    },
    projectID: {  // New field for project reference
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Projects',  // Assuming your collection name is 'projects'
        required: function () { return this.reqType === "PROJECT_DELETION"; } // Required only for project deletions
    },
    reqType: {
        type: String,
        enum: ['ADMIN_ACCESS', 'USER_ADDITION', 'USER_DELETION', 'PROJECT_DELETION'],
        required: true
    },
    reqStatus: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    reason: {
        type: String,
        required: false
    }
}, { timestamps: true });

const RequestModel = mongoose.model("Requests", requestSchema);

export default RequestModel;

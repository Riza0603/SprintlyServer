import mongoose from "mongoose";


// Define schema
const requestSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "registers",
      },
      
      pendingUserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PendingUser",
      },
      
    targetUserID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "registers", // Reference to users collection
        validate: {
            validator: function (value) {
                return this.reqType === "USER_DELETION" ? !!value : true;
            },
            message: "targetUserID is required for USER_DELETION requests.",
        },
    },
    projectID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Projects",
        validate: {
            validator: function (value) {
                return ["PROJECT_DELETION", "ADMIN_ACCESS"].includes(this.reqType) ? !!value : true;
            },
            message: "projectID is required for PROJECT_DELETION and ADMIN_ACCESS requests.",
        },
    },
    reqType: {
        type: String,
        enum: ["ADMIN_ACCESS", "USER_ADDITION", "USER_DELETION", "PROJECT_DELETION", "SIGNUP_REQUEST"],
        required: true,
        trim: true
      },      
    reqStatus: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
        trim: true
    },
    reason: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// ✅ Virtuals for fetching project name, user name, and user role
requestSchema.virtual("projectName", {
    ref: "Projects",
    localField: "projectID",
    foreignField: "_id",
    justOne: true,
    options: { select: "pname" } // Only fetch the project name
});

// ✅ Virtual for fetching the target user's name only
requestSchema.virtual("targetUserName", {
    ref: "registers",
    localField: "targetUserID",
    foreignField: "_id",
    justOne: true,
    options: { select: "name" }, // Only fetch name
});

requestSchema.virtual("userDetails", {
    ref: "registers",
    localField: "userID",
    foreignField: "_id",
    justOne: true,
    options: { select: "name role" } // Only fetch the user's name & role
});

// ✅ Include virtuals when converting to JSON
requestSchema.set("toObject", { virtuals: true });
requestSchema.set("toJSON", { virtuals: true });

// Create model
const RequestModel = mongoose.model("Request", requestSchema);

export default RequestModel;

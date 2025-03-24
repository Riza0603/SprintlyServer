import mongoose from "mongoose";


// Define schema
const requestSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "registers", // Make sure your user model is named "Register"
        required: true
    },
    // targetUserID: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "registers",
    //     validate: {
    //         validator: function (value) {
    //             return this.reqType === "USER_DELETION" ? !!value : true;
    //         },
    //         message: "targetUserID is required for USER_DELETION requests."
    //     }
    // },
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
    // projectID: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Projects",
    //     validate: {
    //         validator: function (value) {
    //             // return this.reqType === "PROJECT_DELETION" ? !!value : true;
    //             return this.reqType === "PROJECT_DELETION" || this.reqType === "ADMIN_ACCESS" ? !!value : true;
    //         },
    //         message: "projectID is required for PROJECT_DELETION requests."
    //     }
    // },
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
        enum: ["ADMIN_ACCESS", "USER_ADDITION", "USER_DELETION", "PROJECT_DELETION"],
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





//old schema**************************************************************

// import mongoose from "mongoose";

// const requestSchema = new mongoose.Schema({
//     userID: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'registers',
//         required: true
//     },
//     targetUserID: {  // New field for the user to be deleted
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "registers",
//         required: function () { return this.reqType === "USER_DELETION"; } // Required only for user deletion
//     },
//     projectID: {  // New field for project reference
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Projects',  // Assuming your collection name is 'projects'
//         required: function () { return this.reqType === "PROJECT_DELETION"; } // Required only for project deletions
//     },
//     reqType: {
//         type: String,
//         enum: ['ADMIN_ACCESS', 'USER_ADDITION', 'USER_DELETION', 'PROJECT_DELETION'],
//         required: true
//     },
//     reqStatus: {
//         type: String,
//         enum: ['PENDING', 'APPROVED', 'REJECTED'],
//         default: 'PENDING'
//     },
//     reason: {
//         type: String,
//         required: false
//     }
// }, { timestamps: true });

// const RequestModel = mongoose.model("Requests", requestSchema);

// export default RequestModel;


import RequestModel from "../models/Requests.js"; // Correct import
import UserModel from "../models/User.js";
import ProjectModel from "../models/Projects.js"; // Not being used here, but included for consistency

// Approve admin access

export const getAllUsers = async (req, res) => { 
  try {
    const users = await UserModel.find({}, "-password -__v"); // Exclude passwords for security
    const userCount = users.length;
    res.status(200).json({ success: true, users, userCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching users", error: error.message });
  }
};


// Admin Access Handler

export const adminAccessHandler = async (req, res) => {
    try {
        const { requestID, decision, adminID } = req.body;

        if (!requestID || !adminID || !['APPROVED', 'REJECTED'].includes(decision)) {
            return res.status(400).json({ success: false, message: "Invalid input." });
        }

        // Check if the approving user is an admin
        const adminUser = await UserModel.findById(adminID);
        if (!adminUser || !adminUser.adminAccess) {
            return res.status(403).json({ success: false, message: "Unauthorized: Only admins can approve/reject requests." });
        }

        // Fetch the request
        const request = await RequestModel.findById(requestID);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found." });
        }

        // Ensure it is an ADMIN_ACCESS request
        if (request.reqType !== "ADMIN_ACCESS") {
            return res.status(400).json({ success: false, message: "Invalid request type." });
        }

        const { userID } = request; // Extract userID from the request document

        if (decision === 'APPROVED') {
            // Update user collection to grant admin access
            const user = await UserModel.findByIdAndUpdate(
                userID,
                { adminAccess: true },
                { new: true }
            );
            
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found." });
            }
        }
        
        // Remove the request from the Request collection
        await RequestModel.findByIdAndDelete(requestID);

        return res.status(200).json({
            success: true,
            message: `Admin access request has been ${decision.toLowerCase()}.`,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// export const approveAdminAccess = async (req, res) => {
//     console.log("entered confirm api");
//   const { requestId } = req.body;

//   try {
//     const request = await RequestModel.findById(requestId); // Use RequestModel here
//     if (!request) {
//       return res.status(404).json({ message: 'Request not found' });
//     }

//     // Assuming the request is related to a user
//     const user = await UserModel.findById(request.userDetails._id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     user.adminAccess = true; // Grant admin access
//     await user.save();

//     // Optionally, you can mark the request as approved
//     request.status = 'Approved';
//     await request.save();

//     res.status(200).json({ message: 'Admin access granted successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error approving admin access' });
//   }
// };

// // Reject a request
// export const rejectRequest = async (req, res) => {
//   const { requestId } = req.params;

//   try {
//     const request = await RequestModel.findById(requestId); // Use RequestModel here
//     if (!request) {
//       return res.status(404).json({ message: 'Request not found' });
//     }

//     // Delete the request
//     await request.remove();

//     res.status(200).json({ message: 'Request rejected successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error rejecting the request' });
//   }
// };




// Fetching all the requests
// export const getAllRequests = async(req, res)=>{
//     try {
//         const requests = await RequestModel.find();
//         res.status(200).json({ success: true, data: requests });  
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Error fetching projects", error: error.message });
//     }
// };

//new api created for the fetching necessary data
export const getAllRequests = async (req, res) => {
    try {
        const requests = await RequestModel.find()
            .populate("projectName")  // Fetch project name from virtuals
            .populate("userDetails")  // Fetch user name & role from virtuals
            .populate("targetUserID")
            .lean();  // Convert Mongoose documents to plain objects (faster response)

        res.status(200).json({ success: true, data: requests });  
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching requests", error: error.message });
    }
};



// creating an admin access request

export const createAdminAccessRequest = async (req, res) => {
    try {
        const { userID, reason } = req.body;  // Extract reason from req.body

        if (!userID) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // Checking if userID is a registered user
        const userExists = await UserModel.findById(userID);
        if (!userExists) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if user already has admin access
        if (userExists.adminAccess) {
            return res.status(400).json({ success: false, message: "You are already an admin." });
        }

        // Creating a new Request
        const newRequest = new RequestModel({
            userID,
            reqType: "ADMIN_ACCESS",
            reason: reason || "No reason provided"  // Assign reason properly
        });

        await newRequest.save();

        return res.status(201).json({
            success: true,
            message: "Admin access request submitted successfully",
            request: newRequest
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// creating a user addition request

export const createUserAdditionRequest = async (req, res) => {
    try {
        const { userID, reason } = req.body;  // Extract reason from request body

        if (!userID) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // Validate if userID is a registered user
        const userExists = await UserModel.findById(userID);
        if (!userExists) {
            return res.status(404).json({ success: false, message: "User not found" });
        } 

        // Creating a new request with reason
        const newRequest = new RequestModel({
            userID,
            reqType: "USER_ADDITION",
            reason: reason   // Assign reason properly
        });

        await newRequest.save();

        return res.status(201).json({
            success: true,
            message: "User addition request submitted successfully",
            request: newRequest
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


//Create a User Deletion Request
export const createUserDeletionRequest = async (req, res) => {
    try {
        const { userID, targetUserID, reason } = req.body;

        if (!userID || !targetUserID) {
            return res.status(400).json({ success: false, message: "User ID and Target User ID are required" });
        }

        // Validate if requesting user exists
        const userExists = await UserModel.findById(userID);
        if (!userExists) {
            return res.status(404).json({ success: false, message: "Requesting user not found" });
        }

        // Validate if target user exists
        const targetUserExists = await UserModel.findById(targetUserID);
        if (!targetUserExists) {
            return res.status(404).json({ success: false, message: "Target user not found" });
        }

        // Prevent self-deletion requests
        if (userID === targetUserID) {
            return res.status(400).json({ success: false, message: "You cannot request to delete yourself" });
        }

        // Create the request including targetUserID
        const newRequest = new RequestModel({
            userID,
            targetUserID,  // Storing the user to be deleted
            reqType: "USER_DELETION",
            reason: reason || `Request to delete user: ${targetUserExists.name}`
        });

        await newRequest.save();

        return res.status(201).json({
            success: true,
            message: "User deletion request submitted successfully",
            request: newRequest
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


//creating a project deletion request

export const createProjectDeletionRequest = async (req, res) => {
    try {
        const { userID, projectID, reason } = req.body;

        if (!userID || !projectID) {
            return res.status(400).json({ success: false, message: "User ID and Project ID are required" });
        }

        // Validate if userID is a registered user
        const userExists = await UserModel.findById(userID);
        if (!userExists) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Validate if projectID exists
        const projectExists = await ProjectModel.findById(projectID);
        if (!projectExists) {
            return res.status(404).json({ success: false, message: "Project not found" });
        }

        // Create the request including projectID
        const newRequest = new RequestModel({
            userID,
            projectID,  // Storing projectID
            reqType: "PROJECT_DELETION",
            reason: reason ? `${reason} (Project: ${projectExists.pname})` : `Request to delete project: ${projectExists.pname}`

        });

        await newRequest.save();

        return res.status(201).json({
            success: true,
            message: "Project deletion request submitted successfully",
            request: newRequest
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
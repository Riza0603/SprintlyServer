import RequestModel  from "../models/Requests.js";
import UserModel from "../models/User.js";
import ProjectModel from "../models/Projects.js";
import Notification from "../models/Notification.js";
import TaskModel from "../models/Tasks.js";
import TempTimeModel from "../models/TempTime.js";
import TimeSheetModel from "../models/TimeSheets.js";
import PendingUser from "../models/PendingUser.js";
import axios from 'axios';
import { deleteFilesFromS3 } from "../config/S3functions.js";
import { createNotification } from "./notificationController.js";
import { calculateExperience } from "../services/calculateExperience.js";
import mongoose from "mongoose";
import { sendAdminAccessStatusEmail, sendProjectDeletionStatusEmail, sendProjectDeletionEmail, sendUserDeletedEmail,sendSignupDecisionEmail } from "../services/emailService.js";
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


// project deletion Request Handler

// export const deleteProjectRequestHandler = async (req, res) => {
//     try {
//         const { requestID, decision, adminID } = req.body;

//         if (!requestID || !adminID || !['APPROVED', 'REJECTED'].includes(decision)) {
//             return res.status(400).json({ success: false, message: "Invalid input." });
//         }

//         // Fetch the request
//         const request = await RequestModel.findById(requestID);
//         if (!request) {
//             return res.status(404).json({ success: false, message: "Request not found." });
//         }

//         // Ensure it is a PROJECT_DELETION request
//         if (request.reqType !== "PROJECT_DELETION") {
//             return res.status(400).json({ success: false, message: "Invalid request type." });
//         }

//         // Check if the requester is an admin
//         const adminUser = await UserModel.findById(adminID);
//         if (!adminUser || !adminUser.adminAccess) {
//             return res.status(403).json({ success: false, message: "Only admins can approve project deletion." });
//         }

//         // If request is denied, remove it and return
//         if (decision === "REJECTED") {
//             await RequestModel.findByIdAndDelete(requestID);
//             return res.status(200).json({ success: true, message: "Project deletion request rejected and removed." });
//         }
//         else if(decision === "APPROVED"){

//             const projectID= request.projectID;
//             const myresponse = await axios.delete(`http://localhost:5000/admin/deleteProjectAdmin/${projectID}`);
//             console.log(myresponse);
//             const respooseer=myresponse.data;
//             console.log(myresponse.data.success);
//             if(myresponse.data.success === true)  {
//                 return res.status(200).json({success: true, message: "Project deleted successfully"});
//             } 
            

//         }


//         // // Proceed with project deletion
//         // const projectID = request.projectID;
//         // const project = await ProjectModel.findById(projectID);
//         // if (!project) {
//         //     return res.status(404).json({ success: false, message: "Project not found." });
//         // }

//         // const projectName = project.pname;

//         // // Remove references from other collections
//         // await Promise.all([
//         //     Notification.deleteMany({ "metadata.projectName": projectName }),
//         //     RequestModel.deleteMany({ projectID }),
//         //     TaskModel.deleteMany({ projectName }),
//         //     TempTimeModel.deleteMany({ projectName }),
//         //     TimeSheetModel.updateMany({ "timeSheet.projectsHours.projectName": projectName }, { $pull: { "timeSheet.$[].projectsHours": { projectName } } }),
//         //     UserModel.updateMany({}, { $pull: { projects: projectName } })
//         // ]);

//         // // Delete project from ProjectModel
//         // await ProjectModel.findByIdAndDelete(projectID);

//         // // Remove the request itself
//         // await RequestModel.findByIdAndDelete(requestID);

//         // return res.status(200).json({ success: true, message: "Project deleted successfully and references removed." });
//     } catch (error) {
//         return res.status(500).json({ success: false, message: error.message });
//     }
// };

//withNotification
export const deleteProjectRequestHandler = async (req, res) => {
    try {
      const { requestID, decision, adminID } = req.body;
  
      if (!requestID || !adminID || !['APPROVED', 'REJECTED'].includes(decision)) {
        return res.status(400).json({ success: false, message: "Invalid input." });
      }
  
      // Fetch the request
      const request = await RequestModel.findById(requestID);
      if (!request) {
        return res.status(404).json({ success: false, message: "Request not found." });
      }
  
      if (request.reqType !== "PROJECT_DELETION") {
        return res.status(400).json({ success: false, message: "Invalid request type." });
      }
  
      const adminUser = await UserModel.findById(adminID);
      if (!adminUser || !adminUser.adminAccess) {
        return res.status(403).json({ success: false, message: "Only admins can approve project deletion." });
      }
  
      const { userID, projectID } = request;
      const user = await UserModel.findById(userID);
      const project = await ProjectModel.findById(projectID);
  
      if (!user || !project) {
        return res.status(404).json({ success: false, message: "User or project not found." });
      }
  
      const projectName = project.pname;
  
      if (decision === "REJECTED") {
        await createNotification({
          user_id: userID,
          type: "ProjectDeletion",
          message: `Your request to delete the project "${projectName}" has been rejected by ${adminUser.name}.`,
          entity_id: projectID,
          metadata: {
            status: "REJECTED",
            projectName,
            decidedBy: adminUser.name
          }
        });
        
        await sendProjectDeletionStatusEmail(user,decision,adminUser.name); 
        await RequestModel.findByIdAndDelete(requestID);
        return res.status(200).json({ success: true, message: "Project deletion request rejected and removed." });
      }
  
      if (decision === "APPROVED") {
        // Prepare base notification for members
        const baseNotification = {
          type: "ProjectDeletion",
          message: `The project "${projectName}" you were part of has been deleted by ${adminUser.name}.`,
          entity_id: projectID,
          metadata: {
            projectName,
            deletedBy: adminUser.name,
          },
        };
        
        // Notify the requester
        await createNotification({
          ...baseNotification,
          user_id: userID,
          type: "ProjectDeletion",
          message: `Your request to delete the project "${projectName}" has been approved and processed by ${adminUser.name}.`,
          metadata: {
            status: "APPROVED",
            projectName,
            deletedBy: adminUser.name,
          },
        });

        await sendProjectDeletionStatusEmail(user, decision, adminUser.name);
        // Log memberIDs to verify the IDs before notifying
        const memberIDs = project.members ? Array.from(project.members.keys()) : [];
        //console.log("project.members structure:", project.members);
        //console.log("Members to notify (excluding requester):", memberIDs);
  
        const notifyMembers = memberIDs
          .filter((id) => id !== String(userID)) // Exclude the requester
          .filter((mID) => mongoose.Types.ObjectId.isValid(mID)) // Ensure valid ObjectId
          .map(async (validID) => {
            const memberID = new mongoose.Types.ObjectId(validID);
            
            // In-app notification
            await createNotification({
              ...baseNotification,
              user_id: memberID,
            });
      
            // Email notification
            const member = await UserModel.findById(memberID);
            if (member && member.email) {
              await sendProjectDeletionEmail(member,adminUser.name, projectName);
            }
          });
      
        await Promise.all(notifyMembers);
  
        // Now call delete API AFTER notifications
        const response = await axios.delete(
          `http://localhost:5000/admin/deleteProjectAdmin/${projectID}`
        );
  
        if (response.data.success === true) {
          await RequestModel.findByIdAndDelete(requestID);
          return res
            .status(200)
            .json({
              success: true,
              message: "Project deleted and notifications sent.",
            });
        } else {
          return res
            .status(500)
            .json({
              success: false,
              message: "Project deletion failed at admin route.",
            });
        }
      }
  
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };
  



//



// User Deletion Handler
export const deleteUserRequestHandler = async (req, res) => {
    try {
        const { requestID, decision, adminID } = req.body;

        if (!requestID || !adminID || !['APPROVED', 'REJECTED'].includes(decision)) {
            return res.status(400).json({ success: false, message: "Invalid input." });
        }

        // Fetch the request
        const request = await RequestModel.findById(requestID);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found." });
        }

        // Ensure it is a USER_DELETION request
        if (request.reqType !== "USER_DELETION") {
            return res.status(400).json({ success: false, message: "Invalid request type." });
        }

        // Check if the requester is an admin
        const adminUser = await UserModel.findById(adminID);
        if (!adminUser || !adminUser.adminAccess) {
            return res.status(403).json({ success: false, message: "Only admins can approve user deletion." });
        }

        // If request is denied, remove it and return
        if (decision === "REJECTED") {
            await RequestModel.findByIdAndDelete(requestID);
            return res.status(200).json({ success: true, message: "User deletion request rejected and removed." });
        }

        // Proceed with user deletion
        const userID = request.targetUserID;
        const userExists = await UserModel.findById(userID);
        if (!userExists) {
            return res.status(404).json({ success: false, message: "User not found." });
        }


        let fileUrlsToDelete = [];
        const tasks = await TaskModel.find({
            $or: [
                { assigneeId: userID },
                { createdById: userID },
                { "comments.userId": userID }
            ]
        });
    tasks.forEach((task) => {
      task.comments.forEach((comment) => {
        if (comment.attachments?.length) {
          fileUrlsToDelete.push(...comment.attachments);
        }
      });
    });
    try{
        // First, delete the files from S3
        if (fileUrlsToDelete.length > 0) {
          const fileNamesArray = fileUrlsToDelete.map((url) =>
            Array.isArray(url) ? url : [url]  // Wrap each url in an array if it's not already an array
          );
    
          const deletePromises = fileNamesArray.map((fileUrl) =>
    
            deleteFilesFromS3(fileUrl) // Assume deleteFilesS3 is a function that handles file deletion from S3
          );
    
          // Wait for all file deletions to complete
          await Promise.all(deletePromises);
        }
      }
      catch {console.log("error deleteing files");
        return res
        .status(404)
        .json({ success: false, message: "fiole sdfsdfn not deltedddddd" });  }

        // Remove references from other collections
        await Promise.all([
            ProjectModel.updateMany({}, { $unset: { [`members.${userID}`]: 1 } }),
            ProjectModel.updateMany(
                { projectCreatedBy: userID },
                { $set: { projectCreatedBy: null } }
            ),
            RequestModel.deleteMany({ userID }),
            TaskModel.updateMany({ assigneeId: userID }, { $set: { assignee: "NA", assigneeId: null } }),
            TaskModel.updateMany({ createdById: userID }, { $set: { createdBy: "NA", createdById: null } }),
            TaskModel.updateMany(
                {},
                { $pull: { comments: { userId: userID } } }
            ),
            TempTimeModel.deleteMany({ userId: userID }),
            TimeSheetModel.deleteMany({ userId: userID })
        ]);

        // Delete user from UserModel
        await UserModel.findByIdAndDelete(userID);

        // Send email before deletion
        await sendUserDeletedEmail(userExists);

        // Remove the request itself
        await RequestModel.findByIdAndDelete(requestID);

        return res.status(200).json({ success: true, message: "User deleted successfully and references removed." });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


// Admin Access Handler

// Admin Access Handler
export const adminAccessHandler = async (req, res) => {
    try {
        const { requestID, decision, adminID } = req.body;

        if (!requestID || !adminID || !['APPROVED', 'REJECTED'].includes(decision)) {
            return res.status(400).json({ success: false, message: "Invalid input." });
        }

        const adminUser = await UserModel.findById(adminID);
        if (!adminUser || !adminUser.adminAccess) {
            return res.status(403).json({ success: false, message: "Unauthorized: Only admins can approve/reject requests." });
        }

        const request = await RequestModel.findById(requestID);
        if (!request || request.reqType !== "ADMIN_ACCESS") {
            return res.status(400).json({ success: false, message: "Invalid or missing request." });
        }

        const { userID } = request;
        const user = await UserModel.findById(userID);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (decision === 'APPROVED') {
            user.adminAccess = true;
            await UserModel.updateOne({ _id: user._id }, { adminAccess: true });
        }

        await createNotification({
            user_id: userID,
            type: "AdminAccess",
            message: `Your request for admin access has been ${decision.toLowerCase()}.`,
            entity_id: requestID,
            metadata: {
                status: decision,
                decidedBy: adminUser.name,
            },
        });

        await sendAdminAccessStatusEmail(user, decision, adminUser.name);
        await RequestModel.findByIdAndDelete(requestID);

        return res.status(200).json({
            success: true,
            message: `Admin access request has been ${decision.toLowerCase()}.`,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


//new api created for the fetching necessary data
// export const getAllRequests = async (req, res) => {
//     try {
//         const requests = await RequestModel.find()
//             .populate("projectName")  // Fetch project name from virtuals
//             .populate("userDetails")  // Fetch user name & role from virtuals
//             .populate("targetUserID")
//             .lean();  // Convert Mongoose documents to plain objects (faster response)

//         res.status(200).json({ success: true, data: requests });  
//     } catch (error) {
//         res.status(500).json({ success: false, message: "Error fetching requests", error: error.message });
//     }
// };

export const getAllRequests = async (req, res) => {
  try {
      const requests = await RequestModel.find()
          .populate("projectName")
          .populate("userDetails")
          .populate("targetUserID")
          .lean();

      // Attach pending user details to SIGNUP_REQUESTs
      const enrichedRequests = await Promise.all(
          requests.map(async (req) => {
              if (req.reqType === "SIGNUP_REQUEST" && req.pendingUserID) {
                  const pendingUser = await PendingUser.findById(req.pendingUserID).lean();
                  return { ...req, pendingUserDetails: pendingUser || null };
              }
              return req;
          })
      );

      res.status(200).json({ success: true, data: enrichedRequests });

  } catch (error) {
      res.status(500).json({ 
          success: false, 
          message: "Error fetching requests", 
          error: error.message 
      });
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

        const {projectID } =  req.params;
        const { userID, reason } = req.body;
        if (!userID || !projectID || !reason) {
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

//signup request approve / reject handler
export const handleSignupRequest = async (req, res) => {
  try {
    const { requestID, decision, adminID } = req.body;

    const request = await RequestModel.findById(requestID);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.reqType !== "SIGNUP_REQUEST" || !request.pendingUserID) {
      return res.status(400).json({ success: false, message: "Invalid signup request" });
    }

    const pendingUser = await PendingUser.findById(request.pendingUserID);
    if (!pendingUser) {
      return res.status(404).json({ success: false, message: "Pending user not found" });
    }

    if (decision === "APPROVED") {
      const experience = calculateExperience(pendingUser.dateOfJoining);

      const newUser = new UserModel({
        name: pendingUser.name,
        email: pendingUser.email,
        phone: pendingUser.phone,
        password: pendingUser.password,
        dateOfJoining: pendingUser.dateOfJoining,
        role: "Employee",
        experience: experience,
        reportTo: "N/A",
        projects: [],
        isVerified: true,
        adminAccess: false,
        highestDegree: pendingUser.highestDegree,
      });

      await newUser.save();
    }

    // Send email notification
    await sendSignupDecisionEmail(pendingUser, decision);

    // Cleanup
    await PendingUser.findByIdAndDelete(pendingUser._id);
    await RequestModel.findByIdAndDelete(requestID);

    res.status(200).json({ success: true, message: `Signup request ${decision.toLowerCase()} and associated records deleted.` });
  } catch (error) {
    console.error("Error in handling signup request:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



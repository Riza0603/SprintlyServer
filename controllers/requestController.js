import RequestModel  from "../models/Requests.js";
import UserModel from "../models/User.js";
import ProjectModel from "../models/Projects.js";

// Fetching all the requests

export const getAllRequests = async(req, res)=>{
    try {
        const requests = await RequestModel.find();
        res.status(200).json({ success: true, data: requests });  
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching projects", error: error.message });
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
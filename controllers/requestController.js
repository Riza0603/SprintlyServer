import RequestModel  from "../models/Requests.js";
import UserModel from "../models/User.js";

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
        const { userID } = req.body; 

        if (!userID) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

         // Checking if userID is a registered user
         const userExists = await UserModel.findById(userID);
         if (!userExists) {
             return res.status(404).json({ success: false, message: "User not found" });
         }
 
        // Creating a new Request
        const newRequest = new RequestModel({ userID, reqType: "ADMIN_ACCESS" });

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
        const { userID } = req.body; 

        if (!userID) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

         // Validate if userID is a registered user
         const userExists = await UserModel.findById(userID);
         if (!userExists) {
             return res.status(404).json({ success: false, message: "User not found" });
         } 

        const newRequest = new RequestModel({ userID, reqType: "USER_ADDITION" });

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

//creating a project deletion request

export const createProjectDeletionRequest = async (req, res) => {
    try {
        const { userID } = req.body; 

        if (!userID) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

         // Validate if userID is a registered user
         const userExists = await UserModel.findById(userID);
         if (!userExists) {
             return res.status(404).json({ success: false, message: "User not found" });
         } 

        const newRequest = new RequestModel({ userID, reqType: "PROJECT_DELETION" });

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
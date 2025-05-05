import express from "express";
import {getProjectCounts, addUser, deleteUser, deleteProjectAdmin , getadminProjectDetails} from "../controllers/adminController.js"
const router = express.Router();


router.get("/getProjectCounts",getProjectCounts);
// router.get("/getProjectProgress",getProjectProgress);
// router.get("/getUserByProject",getUsersByProject);
router.delete("/deleteProjectAdmin/:projectID",deleteProjectAdmin);
router.get("/getadminProjectDetails",getadminProjectDetails);
router.post("/addUser", addUser); // Add new user
router.delete("/deleteUser/:id", deleteUser); // Delete user


export default router; 
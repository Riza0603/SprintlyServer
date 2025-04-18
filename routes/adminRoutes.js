import express from "express";
import {getAllProjects,getAllUsers,getProjectCounts, deleteProjectAdmin ,getProjectProgress,getUsersByProject,getUnassignedUsers, getadminProjectDetails} from "../controllers/adminController.js"
const router = express.Router();

router.get("/getAllProjects", getAllProjects);
router.get("/getAllUsers",getAllUsers);
router.get("/getProjectCounts",getProjectCounts);
router.get("/getProjectProgress",getProjectProgress);
router.get("/getUserByProject",getUsersByProject);
router.get("/getUnassignedUsers",getUnassignedUsers);
router.delete("/deleteProjectAdmin/:projectID",deleteProjectAdmin);
router.get("/getadminProjectDetails",getadminProjectDetails)


export default router; 
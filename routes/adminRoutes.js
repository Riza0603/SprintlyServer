import express from "express";
import {getAllProjects,getAllUsers,getProjectCounts,getProjectProgress,getUsersByProject,getUnassignedUsers} from "../controllers/adminController.js"
const router = express.Router();

router.get("/getAllProjects", getAllProjects);
router.get("/getAllUsers",getAllUsers);
router.get("/getProjectCounts",getProjectCounts);
router.get("/getProjectProgress",getProjectProgress);
router.get("/getUserByProject",getUsersByProject);
router.get("/getUnassignedUsers",getUnassignedUsers)


export default router; 
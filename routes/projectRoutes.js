import express from "express";
import { createProject, fetchProjects,updateGlobalSettings,  updateProjectSettings, getMembers, deleteMember, addMember,  deleteUser, getProjectByName, fetchDetails, fetchProjectsById } from "../controllers/projectController.js";

const router = express.Router();

router.post("/createProject", createProject);
router.post("/fetchProjects", fetchProjects);
router.post("/fetchProjectsById", fetchProjectsById);
router.post("/getProject/:projectTitle",getProjectByName);
router.post("/getMembers/:projectName",getMembers);
router.post("/addMember",addMember);
// router.post("/getAllMembers",fetchAllMembers)
router.delete("/deleteMember/:memberId",deleteMember);
router.delete("/deleteUser/:memberId",deleteUser);
router.post("/updateGlobalSettings", updateGlobalSettings);
router.post("/updateProjectSettings/:projectId", updateProjectSettings);
router.get("/project-details",fetchDetails);

export default router;
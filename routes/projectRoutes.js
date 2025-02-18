import express from "express";
import { createProject, fetchProjects,updateGlobalSettings,  updateProjectSettings, getMembers, deleteMember, addMember,  deleteUser } from "../controllers/projectController.js";

const router = express.Router();

router.post("/createProject", createProject);
router.post("/fetchProjects", fetchProjects);
router.post("/getMembers/:projectName",getMembers);
router.post("/addMember",addMember);
// router.post("/getAllMembers",fetchAllMembers)
router.delete("/deleteMember/:memberId",deleteMember);
router.delete("/deleteUser/:memberId",deleteUser);
router.patch("/updateGlobalSettings", updateGlobalSettings);
router.patch("/updateProjectSettings/:projectId", updateProjectSettings);

export default router;

import express from "express";
import { createProject, fetchProjects, fetchProjectNames,updateGlobalSettings,  updateProjectSettings, getMembers, deleteMember, addMember } from "../controllers/projectController.js";

const router = express.Router();

router.post("/createProject", createProject);
router.post("/fetchProjects", fetchProjects);
router.get("/fetchProjectNames", fetchProjectNames);
router.post("/members/:projectName",getMembers);
router.post("/addMember",addMember);
router.delete("/members/:memberId",deleteMember);
router.patch("/updateGlobalSettings", updateGlobalSettings);
router.patch("/updateProjectSettings/:projectId", updateProjectSettings);

export default router;
import express from "express";
import { createProject,fetchProjectData, fetchProjects,getProjectFiles,updateGlobalSettings, updateProjectDeletedFile, updateProject,updateProjectSettings, getMembers, deleteMember, addMember,  deleteUser } from "../controllers/projectController.js";

const router = express.Router();

router.post("/createProject", createProject);
router.post("/fetchProjects", fetchProjects);
router.post("/getMembers/:projectName",getMembers);
router.post("/addMember",addMember);
router.post("/updateProject/:projectId",updateProject);
router.post("/updateProjectDeletedFile/:projectId", updateProjectDeletedFile);
router.get("/fetchProjectData/:projectId", fetchProjectData);

router.delete("/deleteMember/:memberId",deleteMember);
router.delete("/deleteUser/:memberId",deleteUser);
router.patch("/updateGlobalSettings", updateGlobalSettings);
router.patch("/updateProjectSettings/:projectId", updateProjectSettings);
router.post("/getProjectFiles/:projectId",getProjectFiles);
export default router;

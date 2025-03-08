import express from "express";
import { createProject,fetchProjectData, fetchProjects,getProjectFiles,updateGlobalSettings, updateProjectDeletedFile, updateProject, updateProjects,updateProjectSettings, getMembers, deleteMember, addMember,  deleteUser, getProjectByName,deleteProject, fetchDetails, fetchProjectsById, getProjectByManager } from "../controllers/projectController.js";
//import { createProject, fetchProjects,updateGlobalSettings,  updateProjectSettings, getMembers, deleteMember, addMember,  deleteUser, getProjectByName, fetchDetails, fetchProjectsById,updateProject,deleteProject } from "../controllers/projectController.js";

const router = express.Router();

router.post("/createProject", createProject);
router.post("/fetchProjects", fetchProjects);
router.post("/fetchProjectsById", fetchProjectsById);
router.post("/getProject/:projectTitle",getProjectByName);
router.post("/getMembers/:projectName",getMembers);
router.post("/addMember",addMember);
router.post("/updateProject/:projectId",updateProject);
router.post("/updateProjectDeletedFile/:projectId", updateProjectDeletedFile);
router.post("/fetchProjectData/:projectId", fetchProjectData);
router.delete("/deleteMember/:memberId",deleteMember);
router.delete("/deleteUser/:memberId",deleteUser);
router.post("/updateGlobalSettings", updateGlobalSettings);
router.post("/updateProjectSettings/:projectId", updateProjectSettings);
router.get("/project-details",fetchDetails);
router.post("/getProjectFiles/:projectId",getProjectFiles);router.get("/getProjectByCreator/:projectCreatedById",getProjectByManager);
router.post("/updateProjects/:projectId",updateProjects);
router.delete("/delete-project",deleteProject);


router.post("/getProjectFiles/:projectId",getProjectFiles);
export default router;
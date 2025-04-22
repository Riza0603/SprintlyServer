import express from "express";
import { createProject,fetchProjectData, fetchProjects,getProjectFiles,updateProjectLink,updateGlobalSettings, updateProjectDeletedFile, updateProject, updateProjects,updateProjectSettings, getMembers, deleteMember, addMember,  deleteUser, getProjectByName,deleteProject, fetchProjectsById, getProjectByManager, fetchWorkLoad, scheduleVariance, effortDistribution, projectEngagementRate, updateProjectStatus } from "../controllers/projectController.js";
import { generateReport } from "../controllers/projectreport.js";
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
router.get("/projectWorkLoad",fetchWorkLoad);
router.post("/getProjectFiles/:projectId",getProjectFiles);

router.get("/getProjectByCreator/:projectCreatedById",getProjectByManager);
router.get("/schedule-variance/:projectName",scheduleVariance);
router.get("/effort-distribution/:projectName",effortDistribution);
router.get("/engagementrate/:projectName",projectEngagementRate);
router.put("/updateProjects/:projectId",updateProjects);
//router.delete("/deleteProject/:projectId",deleteProject);

router.post("/updateProjectLink/:projectId", updateProjectLink);


router.post("/getProjectFiles/:projectId",getProjectFiles);
router.post("/updateProjectStatus/:projectName",updateProjectStatus);//update project status
router.get("/generate-pdf/:projectName", generateReport);

export default router;
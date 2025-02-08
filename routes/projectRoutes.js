import express from "express";
import { createProject, fetchProjects, fetchProjectNames,updateGlobalSettings,  updateProjectSettings } from "../controllers/projectController.js";

const router = express.Router();

router.post("/createProject", createProject);
router.post("/fetchProjects", fetchProjects);
router.get("/fetchProjectNames", fetchProjectNames);

router.patch("/updateGlobalSettings", updateGlobalSettings);
router.patch("/updateProjectSettings/:projectId", updateProjectSettings);

export default router;

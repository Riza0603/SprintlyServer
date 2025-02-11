import express from "express";
import { createProject, fetchProjects, updateGlobalSettings,  updateProjectSettings } from "../controllers/projectController.js";

const router = express.Router();

router.post("/createProject", createProject);
router.get("/fetchProjects", fetchProjects);
router.patch("/updateGlobalSettings", updateGlobalSettings);
router.patch("/updateProjectSettings/:projectId", updateProjectSettings);

export default router;

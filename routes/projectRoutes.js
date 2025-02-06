import express from "express";
import { createProject, fetchProjects } from "../controllers/projectController.js";

const router = express.Router();

router.post("/createProject", createProject);
router.get("/fetchProjects", fetchProjects);

export default router;

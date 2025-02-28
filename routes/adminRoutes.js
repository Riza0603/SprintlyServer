import express from "express";
import {getAllProjects,getAllUsers,getProjectCounts} from "../controllers/adminController.js"
const router = express.Router();

router.get("/get_all_projects", getAllProjects);
router.get("/User",getAllUsers);
router.get('/get_project_count',getProjectCounts);

export default router;
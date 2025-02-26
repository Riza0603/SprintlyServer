import express from "express";
import {getAllProjects,getAllUsers,getProjectCounts} from "../controllers/adminController.js"
const router = express.Router();

router.get("/projects", getAllProjects);
router.get("/User",getAllUsers);
router.get('/projectCount',getProjectCounts);

export default router;
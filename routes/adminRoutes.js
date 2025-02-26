import express from "express";
import {getAllProjects,getAllUsers} from "../controllers/adminController.js"
const router = express.Router();

router.get("/projects", getAllProjects);
router.get("/User",getAllUsers);

export default router;
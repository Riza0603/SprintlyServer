import express from "express";
import {addUser, deleteUser } from "../controllers/umairController.js";

const router = express.Router();

router.post("/addUser", addUser); // Add new user
router.delete("/deleteUser/:id", deleteUser); // Delete user

export default router;

import express from "express";
import { addUser, deleteUser, getAllUsers, updateUser } from "../controllers/umairController.js";

const router = express.Router();

router.post("/addUser", addUser); // Add new user
router.delete("/deleteUser/:id", deleteUser); // Delete user
router.get("/getAllUsers", getAllUsers); // Get all users
router.post("/updateUser", updateUser); // Update user

export default router;

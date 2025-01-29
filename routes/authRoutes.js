import express from "express";
import { login, forgotPassword, resetPassword } from "../controllers/authController.js";
import { signup, verifyOTP } from "../controllers/otpController.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post("/verifyOTP", verifyOTP);
router.post("/reset-password/:id/:token", resetPassword);

export default router;

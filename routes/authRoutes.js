const express = require("express");
const { login, forgotPassword, resetPassword, signup, verifyOTP } = require("../controllers/authController.js");

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post("/verifyOTP", verifyOTP);
router.post("/reset-password/:id/:token", resetPassword);

export default router;

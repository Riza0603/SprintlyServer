import express from "express";
import { login, forgotPassword, resetPassword, signup, verifyOTP, getUser, updateUser, verifyToken} from "../controllers/authController.js";


const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post("/verifyOTP", verifyOTP);
router.post("/reset-password/:id/:token", resetPassword);
router.post("/getUser/:email", getUser);
router.post("/updateUser", updateUser);
//router.get('/verify-token/:id/:token', verifyToken);
//router.get("/get-reset-token/:id", getResetToken);
export default router;

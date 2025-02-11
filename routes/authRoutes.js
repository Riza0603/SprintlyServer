import express from "express";
import { login, forgotPassword, resetPassword, signup, verifyOTP, getUser, updateUser} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/forgot-password", forgotPassword);
router.post("/verifyOTP", verifyOTP);
router.post("/reset-password/:id/:token", resetPassword);
router.post("/getUser/:email",verifyToken, getUser); //checking whether token valid or not
router.post("/updateUser", updateUser);

export default router;

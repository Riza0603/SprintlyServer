import express from "express";
const router = express.Router();

router.get("/User",getAllUsers);

export default router;
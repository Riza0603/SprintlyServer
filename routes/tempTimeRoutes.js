import express from "express";
import { getTime, startTimer, stopTimer } from "../controllers/tempTimeController.js";

const router = express.Router();

router.post("/startTimer", startTimer);
router.post("/stopTimer", stopTimer);
router.post("/getTime", getTime);

export default router;
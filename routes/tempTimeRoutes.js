import express from "express";
import { fetchTimeEntries, getTime, pauseResumeTimer, startTimer, stopTimer } from "../controllers/tempTimeController.js";

const router = express.Router();

router.post("/startTimer", startTimer);
router.post("/stopTimer", stopTimer);
router.post("/getTime", getTime);
router.get("/fetchTime/:userId",fetchTimeEntries);
router.post("/pauseResumeTimer", pauseResumeTimer);
export default router;
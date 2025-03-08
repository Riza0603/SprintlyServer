import express from "express";
import { fetchTimeEntries,pauseResumeTimer, getAllUserTimesheet, getTime, startTimer, stopTimer, updateTimeSheetStatus } from "../controllers/tempTimeController.js";

const router = express.Router();

router.post("/startTimer", startTimer);
router.post("/stopTimer", stopTimer);
router.post("/getTime", getTime);
router.get("/fetchTime/:userId",fetchTimeEntries)
router.get("/getAllTempTimeSheet", getAllUserTimesheet);
router.put("/updateTimeSheetStatus", updateTimeSheetStatus );
router.post("/pauseResumeTimer", pauseResumeTimer);
export default router;
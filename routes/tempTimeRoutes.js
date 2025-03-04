import express from "express";
import { fetchTimeEntries, getTime, pauseResumeTimer, startTimer, stopTimer,getTimesheetsByProject } from "../controllers/tempTimeController.js";

const router = express.Router();

router.post("/startTimer", startTimer);
router.post("/stopTimer", stopTimer);
router.post("/getTime", getTime);
router.get("/fetchTime/:userId",fetchTimeEntries);
router.post("/pauseResumeTimer", pauseResumeTimer);
router.post("/get_timesheet_by_project",getTimesheetsByProject);
export default router;
import express from "express";
import { getNotifications, markAllNotificationsAsRead, markNotificationAsRead, getUnreadNotificationCount,clearNotifications } from "../controllers/notificationController.js";
import { get } from "mongoose";

const router = express.Router();


router.get("/getNotifications/:userId", getNotifications);
router.put("/mark-as-read/:id", markNotificationAsRead);
router.put("/mark-all-as-read/:userId", markAllNotificationsAsRead);
router.get("/unread-count/:userId", getUnreadNotificationCount);
router.delete("/clear/:userId", clearNotifications);


export default router;
import express from "express";
import {getPresignedUrls, deleteTaskCommentFiles, uploadFiles} from "../controllers/uploadController.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// upload Routes


router.post("/upload", upload.array("file", 10),uploadFiles);


router.post("/getPresignedUrls/:fileName", getPresignedUrls); // Get Presigned Urls
router.delete("/deleteTaskCommentFiles", deleteTaskCommentFiles);

export default router;

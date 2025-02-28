import express from "express";
import {getPresignedUrls, deleteFilesS3,uploadP,/* uploadProfilePic,*/ uploadFiles} from "../controllers/uploadController.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// upload Routes


router.post("/upload", upload.array("file", 10),uploadFiles);
router.post("/uploadP", upload.array("file", 10),uploadP);


router.post("/getPresignedUrls/:fileName", getPresignedUrls); // Get Presigned Urls
router.delete("/deleteFilesS3", deleteFilesS3);
//router.post("uploadProfilePic/:pic", uploadProfilePic);


export default router;

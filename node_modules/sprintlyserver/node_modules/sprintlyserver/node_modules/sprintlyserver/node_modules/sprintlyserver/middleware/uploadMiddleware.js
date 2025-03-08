import multer from "multer";

const storage = multer.memoryStorage(); // Store in memory for direct S3 upload

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export default upload;

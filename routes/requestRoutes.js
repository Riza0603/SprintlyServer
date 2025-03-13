import express from "express";
import { getAllRequests, createAdminAccessRequest, createUserAdditionRequest,createUserDeletionRequest, createProjectDeletionRequest } from "../controllers/requestController.js";
const router = express.Router();

router.get("/get_all_requests",getAllRequests);
router.post("/create_admin_access_request",createAdminAccessRequest);
router.post("/create_user_addition_request",createUserAdditionRequest);
router.post("/create_project_deletion_request",createProjectDeletionRequest);
router.post("/create_user_deletion_request",createUserDeletionRequest);

export default router;
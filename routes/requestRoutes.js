import express from "express";
import { getAllRequests, createAdminAccessRequest, deleteUserRequestHandler, adminAccessHandler,createUserAdditionRequest,createUserDeletionRequest, createProjectDeletionRequest } from "../controllers/requestController.js";
const router = express.Router();

router.get("/get_all_requests",getAllRequests);
// router.get("/", getAllRequests); //new route created

router.post("/create_admin_access_request",createAdminAccessRequest);
router.post("/create_user_addition_request",createUserAdditionRequest);
router.post("/create_project_deletion_request",createProjectDeletionRequest);
router.post("/create_user_deletion_request",createUserDeletionRequest);
router.post("/adminAccessRequestHandler",adminAccessHandler);
router.post("/deleteUserRequestHandler",deleteUserRequestHandler);

export default router;
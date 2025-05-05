import express from "express";
import { getAllRequests, createAdminAccessRequest, deleteProjectRequestHandler, deleteUserRequestHandler, adminAccessHandler,createUserAdditionRequest,createUserDeletionRequest, createProjectDeletionRequest, handleSignupRequest } from "../controllers/requestController.js";
const router = express.Router();

router.get("/get_all_requests",getAllRequests);
// router.get("/", getAllRequests); //new route created

router.post("/create_admin_access_request",createAdminAccessRequest);
router.post("/create_user_addition_request",createUserAdditionRequest);
router.post("/deleteProjectRequest/:projectID",createProjectDeletionRequest);
router.post("/create_user_deletion_request",createUserDeletionRequest);
router.post("/adminAccessRequestHandler",adminAccessHandler);
router.post("/deleteUserRequestHandler",deleteUserRequestHandler);
router.post("/",deleteProjectRequestHandler);
router.post("/signupRequestHandler",handleSignupRequest)

export default router;
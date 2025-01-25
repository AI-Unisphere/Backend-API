import { Router } from "express";
import { createGPO, initializeFirstGPO } from "../controllers/admin.controller";
import { authenticateToken, authorize } from "../middleware/auth";
import { UserRole } from "../types/enums";

const router = Router();

// Public initialization endpoint (only works once)
router.post("/initialize", initializeFirstGPO);

// Protected admin route for creating additional GPO accounts
router.post("/gpo", authenticateToken, authorize([UserRole.GPO]), createGPO);

export default router; 
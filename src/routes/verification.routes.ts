import { Router } from "express";
import { requestVerification, verifyBusiness } from "../controllers/verification.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Request verification (requires vendor authentication)
router.post("/request", authenticateToken, requestVerification);

// Verify business with token (public route)
router.get("/verify/:token", verifyBusiness);

export default router; 
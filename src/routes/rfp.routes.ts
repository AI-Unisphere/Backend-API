import { Router } from "express";
import { createCategory, getCategories, createRfp, getRfps, getRfpById, publishRfp, updateRfp, extractRfpInfo } from "../controllers/rfp.controller";
import { authenticateToken, authorize } from "../middleware/auth";
import { UserRole } from "../types/enums";

const router = Router();

// Category routes
router.post("/categories/create", authenticateToken, authorize([UserRole.GPO]), createCategory);
router.get("/categories", getCategories);

// RFP routes
router.post("/create", authenticateToken, authorize([UserRole.GPO]), createRfp);
router.get("/list", getRfps);
router.get("/:id", getRfpById);
router.patch("/:id", authenticateToken, authorize([UserRole.GPO]), updateRfp);
router.patch("/:id/publish", authenticateToken, authorize([UserRole.GPO]), publishRfp);

// New route for extracting RFP information from document
router.post("/extract-info", authenticateToken, authorize([UserRole.GPO]), extractRfpInfo);

export default router; 
import { Router } from "express";
import { createCategory, getCategories, createRfp, getRfps, getRfpById, publishRfp } from "../controllers/rfp.controller";
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
router.patch("/:id/publish", authenticateToken, authorize([UserRole.GPO]), publishRfp);

export default router; 
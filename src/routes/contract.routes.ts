import { Router } from "express";
import {
    awardContract,
    getContract,
    listContracts,
    createMilestone,
    listMilestones,
    addMilestoneUpdate,
    getMilestoneUpdates,
    getVendorContracts
} from "../controllers/contract.controller";
import { authenticateToken, authorize } from "../middleware/auth";
import { UserRole } from "../types/enums";

const router = Router();

// Protected contract routes
router.post("/rfp/:rfpId/bid/:bidId/award", authenticateToken, authorize([UserRole.GPO]), awardContract);
router.get("/vendor/contracts", authenticateToken, authorize([UserRole.VENDOR]), getVendorContracts);

// Public contract routes
router.get("/rfp/:rfpId", getContract);
router.get("/:id", getContract);
router.get("/", listContracts); 


// Milestone routes
router.post("/:contractId/milestones", authenticateToken, authorize([UserRole.GPO]), createMilestone);
router.get("/:contractId/milestones", listMilestones);
router.post("/:contractId/milestones/:milestoneId/updates", authenticateToken, authorize([UserRole.VENDOR]), addMilestoneUpdate);
router.get("/:contractId/milestones/:milestoneId/updates", getMilestoneUpdates);

export default router;
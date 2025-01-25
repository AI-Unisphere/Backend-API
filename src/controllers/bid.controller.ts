import { Response } from "express";
import { AppDataSource } from "../config/database";
import { Bid, BidStatus } from "../models/Bid";
import { Rfp, RfpStatus } from "../models/Rfp";
import { AuthRequest } from "../middleware/auth";
import { bidAnalysisService } from "../services/bidAnalysis.service";
import { UserRole } from "../types/enums";
import fs from 'fs';
import path from 'path';
import { User } from "../models/User";

const bidRepository = AppDataSource.getRepository(Bid);
const rfpRepository = AppDataSource.getRepository(Rfp);
const userRepository = AppDataSource.getRepository(User);

// Ensure uploads directory exists
const UPLOAD_DIR = 'uploads/proposals';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Validate RFP status and deadline
const validateRfpSubmission = async (rfpId: string): Promise<Rfp> => {
    const rfp = await rfpRepository.findOne({ where: { id: rfpId } });
    if (!rfp) {
        throw new Error("RFP not found");
    }

    if (rfp.status !== RfpStatus.PUBLISHED) {
        throw new Error("This RFP is not accepting submissions");
    }

    if (new Date() > new Date(rfp.submissionDeadline)) {
        throw new Error("The submission deadline for this RFP has passed");
    }

    return rfp;
};

// Check vendor verification status
const checkVendorVerification = async (userId: string): Promise<void> => {
    const vendor = await userRepository.findOne({ where: { id: userId } });
    if (!vendor) {
        throw new Error("Vendor not found");
    }
    if (!vendor.isVerified) {
        throw new Error("Your account must be verified before submitting bids");
    }
};

// Analyze the proposal without saving
export const analyzeBidProposal = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== UserRole.VENDOR) {
            return res.status(403).json({ message: "Only vendors can analyze proposals" });
        }

        // Check verification status
        await checkVendorVerification(req.user.id);

        const { rfpId } = req.params;
        const proposalFile = req.file;

        if (!proposalFile) {
            return res.status(400).json({ message: "Proposal document is required" });
        }

        // Validate RFP status and deadline
        const rfp = await validateRfpSubmission(rfpId);

        // Analyze the proposal
        const analysis = await bidAnalysisService.analyzeBidProposal(
            fs.readFileSync(proposalFile.path),
            proposalFile.originalname,
            rfp
        );

        return res.json({
            message: "Proposal analyzed successfully",
            analysis
        });
    } catch (error: any) {
        console.error("Proposal analysis error:", error);
        return res.status(error.message.includes("verification") ? 403 : 
               error.message.includes("RFP") ? 400 : 500)
            .json({ message: error.message || "Internal server error" });
    }
};

// Submit bid without analysis
export const submitBid = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== UserRole.VENDOR) {
            return res.status(403).json({ message: "Only vendors can submit bids" });
        }

        // Check verification status
        await checkVendorVerification(req.user.id);

        const { rfpId } = req.params;
        const proposalFile = req.file;

        if (!proposalFile) {
            return res.status(400).json({ message: "Proposal document is required" });
        }

        // Just validate RFP without storing result
        await validateRfpSubmission(rfpId);

        // Check if vendor already submitted a bid
        const existingBid = await bidRepository.findOne({
            where: {
                rfpId,
                vendorId: req.user.id,
                status: BidStatus.SUBMITTED
            }
        });

        if (existingBid) {
            // Clean up uploaded file
            fs.unlinkSync(proposalFile.path);
            return res.status(400).json({ message: "You have already submitted a bid for this RFP" });
        }

        // Create new bid with file path
        const bid = bidRepository.create({
            rfpId,
            vendorId: req.user.id,
            proposalDocument: proposalFile.filename, // Store filename instead of file content
            status: BidStatus.SUBMITTED,
            submissionDate: new Date()
        });

        await bidRepository.save(bid);

        return res.status(201).json({
            message: "Bid submitted successfully",
            bid: {
                id: bid.id,
                status: bid.status,
                submissionDate: bid.submissionDate,
                documentUrl: `/api/bids/rfp/${rfpId}/bid/${bid.id}/document` // URL to download document
            }
        });
    } catch (error: any) {
        // Clean up uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Bid submission error:", error);
        return res.status(error.message.includes("verification") ? 403 : 
               error.message.includes("RFP") ? 400 : 500)
            .json({ message: error.message || "Internal server error" });
    }
};

export const saveDraft = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== UserRole.VENDOR) {
            return res.status(403).json({ message: "Only vendors can save bid drafts" });
        }

        const { rfpId } = req.params;
        const proposalFile = req.file;

        if (!proposalFile) {
            return res.status(400).json({ message: "Proposal document is required" });
        }

        // Find existing draft or create new one
        let bid = await bidRepository.findOne({
            where: {
                rfpId,
                vendorId: req.user.id,
                status: BidStatus.DRAFT
            }
        });

        if (bid) {
            bid.proposalDocument = proposalFile.buffer.toString('base64');
            bid.updatedAt = new Date();
        } else {
            bid = bidRepository.create({
                rfpId,
                vendorId: req.user.id,
                proposalDocument: proposalFile.buffer.toString('base64'),
                status: BidStatus.DRAFT
            });
        }

        await bidRepository.save(bid);

        return res.json({
            message: "Draft saved successfully",
            bid: {
                id: bid.id,
                status: bid.status,
                updatedAt: bid.updatedAt
            }
        });
    } catch (error) {
        console.error("Save draft error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getBids = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== UserRole.GPO) {
            return res.status(403).json({ message: "Only GPOs can list bids" });
        }

        const { rfpId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Validate RFP exists and belongs to the GPO
        const rfp = await rfpRepository.findOne({ 
            where: { 
                id: rfpId,
                createdById: req.user.id 
            } 
        });
        
        if (!rfp) {
            return res.status(404).json({ message: "RFP not found" });
        }

        // Get total count for pagination
        const totalCount = await bidRepository
            .createQueryBuilder("bid")
            .where("bid.rfpId = :rfpId", { rfpId })
            .andWhere("bid.status = :status", { status: BidStatus.SUBMITTED })
            .getCount();

        // Get paginated bids
        const bids = await bidRepository
            .createQueryBuilder("bid")
            .leftJoinAndSelect("bid.vendor", "vendor")
            .where("bid.rfpId = :rfpId", { rfpId })
            .andWhere("bid.status = :status", { status: BidStatus.SUBMITTED })
            .select([
                "bid.id",
                "bid.status",
                "bid.submissionDate",
                "vendor.id",
                "vendor.name",
                "vendor.businessName",
                "vendor.businessEmail"
            ])
            .skip(skip)
            .take(limit)
            .orderBy("bid.submissionDate", "DESC")
            .getMany();

        const totalPages = Math.ceil(totalCount / limit);

        return res.json({ 
            data: bids,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limit
            },
            message: "Note: Bid documents will be available after the submission deadline"
        });
    } catch (error) {
        console.error("Get bids error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getBidById = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { rfpId, id } = req.params;

        const bid = await bidRepository.findOne({
            where: { id, rfpId },
            relations: ["vendor", "rfp"]
        });

        if (!bid) {
            return res.status(404).json({ message: "Bid not found" });
        }

        // Handle vendor access
        if (req.user.role === UserRole.VENDOR) {
            if (bid.vendorId !== req.user.id) {
                return res.status(403).json({ message: "Access denied" });
            }
            return res.json({ data: bid });
        }

        // Handle GPO access
        if (req.user.role === UserRole.GPO) {
            if (bid.rfp.createdById !== req.user.id) {
                return res.status(403).json({ message: "Access denied" });
            }

            const now = new Date();
            const deadline = new Date(bid.rfp.submissionDeadline);
            
            if (now < deadline) {
                return res.status(403).json({ 
                    message: "Detailed bid information can only be viewed after the submission deadline",
                    deadline: deadline
                });
            }

            const { id, name, businessName, businessEmail } = bid.vendor;
            bid.vendor = { id, name, businessName, businessEmail } as any;
            return res.json({ data: bid });
        }

        return res.status(403).json({ message: "Invalid role" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Add document download endpoint
export const downloadBidDocument = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { rfpId, id } = req.params;

        // Get both bid and RFP details
        const bid = await bidRepository.findOne({
            where: { id, rfpId },
            relations: ["rfp"]
        });

        if (!bid) {
            return res.status(404).json({ message: "Bid not found" });
        }

        // Vendors can only download their own bids
        if (req.user.role === UserRole.VENDOR) {
            if (bid.vendorId !== req.user.id) {
                return res.status(403).json({ message: "Access denied" });
            }
        }
        // GPOs can only download bids after submission deadline
        else if (req.user.role === UserRole.GPO) {
            const now = new Date();
            const deadline = new Date(bid.rfp.submissionDeadline);
            
            if (now < deadline) {
                return res.status(403).json({ 
                    message: "Bid documents can only be downloaded after the submission deadline",
                    deadline: deadline
                });
            }
        }

        const filePath = path.join(UPLOAD_DIR, bid.proposalDocument);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Proposal document not found" });
        }

        return res.download(filePath);
    } catch (error) {
        console.error("Document download error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}; 
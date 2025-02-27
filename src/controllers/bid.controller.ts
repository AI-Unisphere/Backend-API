import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { UserRole } from "../types/enums";
import { Rfp } from "../models/Rfp";
import { Bid, BidStatus } from "../models/Bid";
import { AppDataSource } from "../config/database";
import { bidEvaluationService } from "../services/bidEvaluation.service";
import { blockchainService } from "../services/blockchain.service";
import fs from "fs";
import path from "path";
import { FindOptionsWhere } from "typeorm";

const rfpRepository = AppDataSource.getRepository(Rfp);
const bidRepository = AppDataSource.getRepository(Bid);

const validateRfpSubmission = async (rfpId: string): Promise<Rfp> => {
    const rfp = await rfpRepository.findOne({
        where: { id: rfpId } as FindOptionsWhere<Rfp>,
        select: ["id", "submissionDeadline", "isPublished", "requirements", "evaluationMetrics", "title", "shortDescription"]
    });
    if (!rfp) {
        throw new Error("RFP not found");
    }

    if (rfp.submissionDeadline < new Date()) {
        throw new Error("RFP submission deadline has passed");
    }

    if (!rfp.isPublished) {
        throw new Error("RFP is not published");
    }

    return rfp;
};

const checkVendorVerification = async (userId: string): Promise<void> => {
    // This is a placeholder - implement actual verification logic
    // For now, we'll just resolve the promise
    // TODO: Implement actual vendor verification logic
    console.log("Vendor verification check for user:", userId);
    await Promise.resolve();
};

export const analyzeBidProposal = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== UserRole.VENDOR) {
            return res.status(403).json({ message: "Only vendors can analyze proposals" });
        }

        const { rfpId } = req.params;
        const proposalFile = req.file;

        if (!proposalFile) {
            return res.status(400).json({ message: "No proposal document provided" });
        }

        // Validate RFP and vendor
        const rfp = await validateRfpSubmission(rfpId);
        await checkVendorVerification(req.user.id);

        // Create a temporary bid object for analysis
        const tempBid = bidRepository.create({
            rfpId,
            vendorId: req.user.id,
            proposalDocument: proposalFile.filename,
            status: BidStatus.DRAFT
        });

        // Analyze the bid using both the bid object and RFP
        const analysis = await bidEvaluationService.evaluateBid(tempBid, rfp);

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

export const submitBid = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== UserRole.VENDOR) {
            return res.status(403).json({ message: "Only vendors can submit bids" });
        }

        const { rfpId } = req.params;
        const proposalFile = req.file;

        if (!proposalFile) {
            return res.status(400).json({ message: "No proposal document provided" });
        }

        // Validate RFP and vendor
        await validateRfpSubmission(rfpId);
        await checkVendorVerification(req.user.id);

        const bid = bidRepository.create({
            rfpId,
            vendorId: req.user.id,
            proposalDocument: proposalFile.filename,
            status: BidStatus.SUBMITTED,
            submissionDate: new Date()
        });

        await bidRepository.save(bid);

        const submissionTxUrl = await blockchainService.logBidSubmission(
            bid.id,
            rfpId,
            req.user.id,
            proposalFile.filename
        );

        bid.submissionTxUrl = submissionTxUrl;
        await bidRepository.save(bid);

        return res.status(201).json({
            message: "Bid submitted successfully",
            data: bid
        });
    } catch (error: any) {
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
            return res.status(400).json({ message: "No proposal document provided" });
        }

        // Validate RFP
        await validateRfpSubmission(rfpId);

        const bid = bidRepository.create({
            rfpId,
            vendorId: req.user.id,
            proposalDocument: proposalFile.filename,
            status: BidStatus.DRAFT
        });

        await bidRepository.save(bid);

        return res.json({
            message: "Draft saved successfully",
            data: bid
        });
    } catch (error: any) {
        console.error("Save draft error:", error);
        return res.status(error.message.includes("RFP") ? 400 : 500)
            .json({ message: error.message || "Internal server error" });
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

        const [bids, total] = await bidRepository.findAndCount({
            where: { rfpId } as FindOptionsWhere<Bid>,
            relations: ["vendor"],
            skip,
            take: limit,
            order: { submissionDate: "DESC" }
        });

        return res.json({
            data: bids,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
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
            where: { id, rfpId } as FindOptionsWhere<Bid>,
            relations: ["vendor", "rfp"]
        });

        if (!bid) {
            return res.status(404).json({ message: "Bid not found" });
        }

        // Check access rights
        if (req.user.role !== UserRole.GPO && bid.vendorId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        return res.json({ data: bid });
    } catch (error) {
        console.error("Get bid error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const downloadBidDocument = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { rfpId, id } = req.params;

        const bid = await bidRepository.findOne({
            where: { id, rfpId } as FindOptionsWhere<Bid>,
            relations: ["rfp"]
        });

        if (!bid) {
            return res.status(404).json({ message: "Bid not found" });
        }

        // Check access rights
        if (req.user.role !== UserRole.GPO && bid.vendorId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        const filePath = path.join(process.cwd(), 'uploads/proposals', bid.proposalDocument);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "Document not found" });
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${bid.proposalDocument}`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        // Add return statement to satisfy TypeScript
        return;
    } catch (error) {
        console.error("Download document error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getPublicBids = async (req: Request, res: Response) => {
    try {
        const { rfpId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [bids, total] = await bidRepository.findAndCount({
            where: { rfpId, status: BidStatus.SUBMITTED } as FindOptionsWhere<Bid>,
            select: ["id", "submissionDate", "status"],
            skip,
            take: limit,
            order: { submissionDate: "DESC" }
        });

        return res.json({
            data: bids,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error("Get public bids error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getPublicBidDetails = async (req: Request, res: Response) => {
    try {
        const { rfpId, id } = req.params;

        const bid = await bidRepository.findOne({
            where: { id, rfpId, status: BidStatus.SUBMITTED } as FindOptionsWhere<Bid>,
            select: ["id", "submissionDate", "status", "evaluationScore"]
        });

        if (!bid) {
            return res.status(404).json({ message: "Bid not found" });
        }

        return res.json({ data: bid });
    } catch (error) {
        console.error("Get public bid details error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}; 
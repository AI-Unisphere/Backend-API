import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Contract } from "../models/Contract";
import { Milestone } from "../models/Milestone";
import { MilestoneUpdate } from "../models/MilestoneUpdate";
import { Rfp, RfpStatus } from "../models/Rfp";
import { Bid } from "../models/Bid";
import { AuthRequest } from "../middleware/auth";
import { UserRole, ContractStatus, MilestoneStatus } from "../types/enums";

const contractRepository = AppDataSource.getRepository(Contract);
const milestoneRepository = AppDataSource.getRepository(Milestone);
const milestoneUpdateRepository = AppDataSource.getRepository(MilestoneUpdate);
const rfpRepository = AppDataSource.getRepository(Rfp);
const bidRepository = AppDataSource.getRepository(Bid);

// Contract Management
export const awardContract = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== UserRole.GPO) {
            return res.status(403).json({ message: "Only GPOs can award contracts" });
        }

        const { rfpId, bidId } = req.params;
        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        // Validate RFP and bid
        const rfp = await rfpRepository.findOne({ 
            where: { id: rfpId },
            relations: ["bids"]
        });
        
        if (!rfp) {
            return res.status(404).json({ message: "RFP not found" });
        }

        if (rfp.status === RfpStatus.CLOSED) {
            return res.status(400).json({ message: "RFP is already closed and awarded" });
        }

        const bid = await bidRepository.findOne({ 
            where: { id: bidId, rfpId },
            relations: ["vendor"]
        });

        if (!bid) {
            return res.status(404).json({ message: "Bid not found for this RFP" });
        }

        // Create contract
        const contract = contractRepository.create({
            rfpId,
            bidId,
            vendorId: bid.vendorId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: ContractStatus.ACTIVE,
            awardDate: new Date(),
            totalValue: rfp.budget
        });

        await contractRepository.save(contract);

        // Update RFP status and awarded details
        await rfpRepository.update(rfpId, { 
            status: RfpStatus.CLOSED,
            awardedContractId: contract.id,
            awardedVendorId: bid.vendorId,
            awardedDate: new Date()
        });

        return res.status(201).json({
            message: "Contract awarded successfully",
            data: {
                contract,
                vendor: bid.vendor,
                rfp: rfp
            }
        });
    } catch (error) {
        console.error("Contract award error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getContract = async (req: Request, res: Response) => {
    try {
        const { id, rfpId } = req.params;
        
        let contract;
        if (rfpId) {
            // Find by RFP ID
            contract = await contractRepository.findOne({
                where: { rfpId },
                relations: ["rfp", "vendor", "bid", "milestones"]
            });
        } else {
            // Find by contract ID
            contract = await contractRepository.findOne({
                where: { id },
                relations: ["rfp", "vendor", "bid", "milestones"]
            });
        }

        if (!contract) {
            return res.status(404).json({ 
                message: rfpId ? "No contract found for this RFP" : "Contract not found" 
            });
        }

        return res.json({ data: contract });
    } catch (error) {
        console.error("Get contract error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Add new endpoint for vendor's contracts
export const getVendorContracts = async (req: AuthRequest, res: Response) => {
    try {
        const vendorId = req.user?.id;
        const contracts = await contractRepository.find({
            where: { vendorId },
            relations: ["rfp", "bid", "milestones"],
            order: { awardDate: "DESC" }
        });

        return res.json({ data: contracts });
    } catch (error) {
        console.error("Get vendor contracts error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const listContracts = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [contracts, total] = await contractRepository.findAndCount({
            relations: ["rfp", "vendor"],
            order: { createdAt: "DESC" },
            skip,
            take: limit
        });

        return res.json({
            data: contracts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error("List contracts error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Milestone Management
export const createMilestone = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== UserRole.GPO) {
            return res.status(403).json({ message: "Only GPOs can create milestones" });
        }

        const { contractId } = req.params;
        const { title, description, dueDate } = req.body;

        const contract = await contractRepository.findOne({ where: { id: contractId } });
        if (!contract) {
            return res.status(404).json({ message: "Contract not found" });
        }

        const milestone = milestoneRepository.create({
            contractId,
            title,
            description,
            dueDate,
            status: MilestoneStatus.NOT_STARTED
        });

        await milestoneRepository.save(milestone);

        return res.status(201).json({
            message: "Milestone created successfully",
            data: milestone
        });
    } catch (error) {
        console.error("Create milestone error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const listMilestones = async (req: Request, res: Response) => {
    try {
        const { contractId } = req.params;
        const milestones = await milestoneRepository.find({
            where: { contractId },
            relations: ["updates"],
            order: { dueDate: "ASC" }
        });

        return res.json({ data: milestones });
    } catch (error) {
        console.error("List milestones error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const addMilestoneUpdate = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== UserRole.VENDOR) {
            return res.status(403).json({ message: "Only vendors can update milestones" });
        }

        const { contractId, milestoneId } = req.params;
        const { status, details, media } = req.body;

        // Verify milestone exists and belongs to contract
        const milestone = await milestoneRepository.findOne({
            where: { id: milestoneId, contractId }
        });

        if (!milestone) {
            return res.status(404).json({ message: "Milestone not found" });
        }

        // Verify vendor owns the contract
        const contract = await contractRepository.findOne({
            where: { id: contractId, vendorId: req.user.id }
        });

        if (!contract) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Create update
        const update = milestoneUpdateRepository.create({
            milestoneId,
            contractId,
            status,
            details,
            media,
            updatedById: req.user!.id
        });

        await milestoneUpdateRepository.save(update);

        // Update milestone status
        milestone.status = status;
        await milestoneRepository.save(milestone);

        return res.status(201).json({
            message: "Milestone update added successfully",
            data: update
        });
    } catch (error) {
        console.error("Add milestone update error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getMilestoneUpdates = async (req: Request, res: Response) => {
    try {
        const { contractId, milestoneId } = req.params;
        const updates = await milestoneUpdateRepository.find({
            where: { milestoneId, contractId },
            relations: ["updatedBy"],
            order: { createdAt: "DESC" }
        });

        return res.json({ data: updates });
    } catch (error) {
        console.error("Get milestone updates error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { RfpCategory } from "../models/RfpCategory";
import { Rfp, RfpStatus } from "../models/Rfp";
import { llmService } from "../services/rfpGeneration.service";
import { AuthRequest } from "../middleware/auth";
import { UserRole } from "../types/enums";
import { blockchainService } from "../services/blockchain.service";

const rfpRepository = AppDataSource.getRepository(Rfp);
const categoryRepository = AppDataSource.getRepository(RfpCategory);

// Category Management
export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== UserRole.GPO) {
            return res.status(403).json({ message: "Only GPOs can create categories" });
        }

        const { name, description } = req.body;

        const existingCategory = await categoryRepository.findOne({ where: { name } });
        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists" });
        }

        const category = categoryRepository.create({ name, description });
        await categoryRepository.save(category);

        return res.status(201).json({
            message: "Category created successfully",
            data: category
        });
    } catch (error) {
        console.error("Category creation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await categoryRepository.find();
        return res.json({ data: categories });
    } catch (error) {
        console.error("Get categories error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// RFP Management
export const createRfp = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== UserRole.GPO) {
            return res.status(403).json({ message: "Only GPOs can create RFPs" });
        }

        const {
            title,
            shortDescription,
            timeline,
            budget,
            issueDate,
            submissionDeadline,
            categoryId,
            technicalRequirements,
            managementRequirements,
            pricingDetails,
            evaluationCriteria,
            specialInstructions
        } = req.body;

        // Validate submission deadline
        const deadlineDate = new Date(submissionDeadline);
        if (isNaN(deadlineDate.getTime())) {
            return res.status(400).json({ 
                message: "Invalid submission deadline format. Use ISO 8601 format (e.g., 2024-03-21T15:00:00Z)" 
            });
        }

        // Validate that deadline is in the future
        if (deadlineDate <= new Date()) {
            return res.status(400).json({ 
                message: "Submission deadline must be in the future" 
            });
        }

        // Validate category
        const category = await categoryRepository.findOne({ where: { id: categoryId } });
        if (!category) {
            return res.status(400).json({ message: "Invalid category" });
        }

        // Generate long description using LLM
        const longDescription = await llmService.generateRfpDescription({
            title,
            shortDescription,
            technicalRequirements,
            managementRequirements,
            pricingDetails,
            evaluationCriteria,
            budget,
            specialInstructions
        });

        // Create RFP
        const rfp = rfpRepository.create({
            title,
            shortDescription,
            longDescription,
            timelineStartDate: new Date(timeline.startDate),
            timelineEndDate: new Date(timeline.endDate),
            budget,
            issueDate: new Date(issueDate),
            submissionDeadline: deadlineDate,
            categoryId,
            createdById: req.user!.id,
            status: RfpStatus.DRAFT
        });

        await rfpRepository.save(rfp);

        // Log to blockchain and get transaction URL
        const creationTxUrl = await blockchainService.logRfpCreation(
            rfp.id,
            rfp.title,
            rfp.budget,
            rfp.submissionDeadline,
            rfp.createdById
        );

        // Update RFP with blockchain transaction URL
        rfp.creationTxUrl = creationTxUrl;
        await rfpRepository.save(rfp);

        return res.status(201).json({
            message: "RFP created successfully",
            data: {
                ...rfp,
                submissionDeadline: rfp.submissionDeadline.toISOString(),
                blockchainTransactions: {
                    creation: creationTxUrl
                }
            }
        });
    } catch (error) {
        console.error("RFP creation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getRfps = async (req: Request, res: Response) => {
    try {
        const { status, categoryId } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const queryBuilder = rfpRepository
            .createQueryBuilder("rfp")
            .leftJoinAndSelect("rfp.category", "category")
            .leftJoinAndSelect("rfp.createdBy", "createdBy")
            .select([
                "rfp",
                "category",
                "createdBy.id",
                "createdBy.name",
                "createdBy.email"
            ]);

        // Apply filters
        if (status) {
            queryBuilder.andWhere("rfp.status = :status", { status });
        }

        if (categoryId) {
            queryBuilder.andWhere("rfp.categoryId = :categoryId", { categoryId });
        }

        // Get total count for pagination
        const totalCount = await queryBuilder.getCount();

        // Add pagination
        const rfps = await queryBuilder
            .skip(skip)
            .take(limit)
            .orderBy("rfp.createdAt", "DESC")
            .getMany();

        // Format dates in ISO 8601
        const formattedRfps = rfps.map(rfp => ({
            ...rfp,
            submissionDeadline: rfp.submissionDeadline.toISOString(),
            timelineStartDate: rfp.timelineStartDate.toISOString(),
            timelineEndDate: rfp.timelineEndDate.toISOString(),
            issueDate: rfp.issueDate.toISOString(),
            createdAt: rfp.createdAt.toISOString(),
            updatedAt: rfp.updatedAt.toISOString()
        }));

        const totalPages = Math.ceil(totalCount / limit);

        return res.json({
            data: formattedRfps,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error("Get RFPs error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getRfpById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const rfp = await rfpRepository.findOne({
            where: { id },
            relations: [
                "category", 
                "createdBy", 
                "awardedContract",
                "awardedVendor",
                "bids",
                "bids.vendor"
            ]
        });

        if (!rfp) {
            return res.status(404).json({ message: "RFP not found" });
        }

        // Format dates in ISO 8601
        const formattedRfp = {
            ...rfp,
            submissionDeadline: rfp.submissionDeadline.toISOString(),
            timelineStartDate: rfp.timelineStartDate.toISOString(),
            timelineEndDate: rfp.timelineEndDate.toISOString(),
            issueDate: rfp.issueDate.toISOString(),
            createdAt: rfp.createdAt.toISOString(),
            updatedAt: rfp.updatedAt.toISOString(),
            awardedDate: rfp.awardedDate?.toISOString(),
            blockchainTransactions: {
                creation: rfp.creationTxUrl,
                publication: rfp.publicationTxUrl
            },
            bids: rfp.bids.map(bid => ({
                id: bid.id,
                vendorId: bid.vendorId,
                status: bid.status,
                evaluationScore: bid.evaluationScore,
                submissionDate: bid.submissionDate?.toISOString(),
                vendor: {
                    id: bid.vendor.id,
                    name: bid.vendor.name
                }
            }))
        };

        return res.json({ data: formattedRfp });
    } catch (error) {
        console.error("Get RFP error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const publishRfp = async (req: AuthRequest, res: Response) => {
    try {
        if (req.user?.role !== UserRole.GPO) {
            return res.status(403).json({ message: "Only GPOs can publish RFPs" });
        }

        const { id } = req.params;

        const rfp = await rfpRepository.findOne({
            where: { id },
            relations: ["createdBy"]
        });

        if (!rfp) {
            return res.status(404).json({ message: "RFP not found" });
        }

        // Check if the GPO is the creator of the RFP
        if (rfp.createdById !== req.user.id) {
            return res.status(403).json({ message: "Only the GPO who created this RFP can publish it" });
        }

        if (rfp.isPublished) {
            return res.status(400).json({ message: "RFP is already published" });
        }

        // Update RFP status
        rfp.isPublished = true;
        rfp.status = RfpStatus.PUBLISHED;
        rfp.issueDate = new Date();

        // Log to blockchain and get transaction URL
        const publicationTxUrl = await blockchainService.logRfpPublication(rfp.id, 0); // 0 means unlimited bids

        // Update RFP with blockchain transaction URL
        rfp.publicationTxUrl = publicationTxUrl;
        await rfpRepository.save(rfp);

        return res.json({
            message: "RFP published successfully",
            data: {
                id: rfp.id,
                title: rfp.title,
                status: rfp.status,
                isPublished: rfp.isPublished,
                issueDate: rfp.issueDate.toISOString(),
                blockchainTransactions: {
                    creation: rfp.creationTxUrl,
                    publication: publicationTxUrl
                }
            }
        });
    } catch (error) {
        console.error("Publish RFP error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}; 
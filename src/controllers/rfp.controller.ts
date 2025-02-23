import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Rfp, RfpStatus } from "../models/Rfp";
import { RfpCategory } from "../models/RfpCategory";
import { AuthRequest } from "../middleware/auth";
import { UserRole } from "../types/enums";
import { rfpGenerationService } from "../services/rfpGeneration.service";
import { blockchainService } from "../services/blockchain.service";
import multer from "multer";
import path from "path";
import fs from "fs";
import pdfParse from "pdf-parse";

const rfpRepository = AppDataSource.getRepository(Rfp);
const categoryRepository = AppDataSource.getRepository(RfpCategory);

// Configure multer for document upload
const UPLOAD_DIR = 'uploads/rfp-documents';
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const uploadConfig = {
    storage: multer.diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1
    },
    fileFilter: (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        // Only accept PDF files
        if (file.mimetype !== 'application/pdf') {
            cb(new Error('Only PDF files are allowed'));
            return;
        }

        // Additional check for file extension
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.pdf') {
            cb(new Error('Only PDF files are allowed'));
            return;
        }

        cb(null, true);
    }
};

const upload = multer(uploadConfig).single('document');

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
        const longDescription = await rfpGenerationService.generateRfpDescription({
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

export const getRfps = async (req: Request<any, any, any, { status?: string; categoryId?: string; page?: string; limit?: string }>, res: Response) => {
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
            const statuses = (status as string).split(',');
            queryBuilder.andWhere("rfp.status IN (:...statuses)", { statuses });
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

        return res.json({
            data: formattedRfps,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit
            }
        });
    } catch (error) {
        console.error("Get RFPs error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getRfpById = async (req: Request<{ id: string }>, res: Response) => {
    try {
        const { id } = req.params;

        const rfp = await rfpRepository.findOne({
            where: { id },
            relations: ["category", "createdBy"]
        });

        if (!rfp) {
            return res.status(404).json({ message: "RFP not found" });
        }

        return res.json({
            data: {
                ...rfp,
                submissionDeadline: rfp.submissionDeadline.toISOString(),
                timelineStartDate: rfp.timelineStartDate.toISOString(),
                timelineEndDate: rfp.timelineEndDate.toISOString(),
                issueDate: rfp.issueDate.toISOString(),
                createdAt: rfp.createdAt.toISOString(),
                updatedAt: rfp.updatedAt.toISOString()
            }
        });
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

export const updateRfp = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== UserRole.GPO) {
            return res.status(403).json({ message: "Only GPOs can update RFPs" });
        }

        const { id } = req.params;
        const updateData = req.body;

        // Find the RFP
        const rfp = await rfpRepository.findOne({
            where: { id },
            relations: ["category", "createdBy"]
        });

        if (!rfp) {
            return res.status(404).json({ message: "RFP not found" });
        }

        // Check if RFP is in DRAFT status
        if (rfp.status !== RfpStatus.DRAFT) {
            return res.status(403).json({ 
                message: "Cannot update RFP after publication",
                currentStatus: rfp.status
            });
        }

        // Check if user is the creator of the RFP
        if (rfp.createdById !== req.user.id) {
            return res.status(403).json({ message: "Only the creator can update this RFP" });
        }

        // Convert and validate dates if they're being updated
        if (updateData.submissionDeadline) {
            const deadlineDate = new Date(updateData.submissionDeadline);
            if (isNaN(deadlineDate.getTime())) {
                return res.status(400).json({ 
                    message: "Invalid submission deadline format. Use ISO 8601 format (e.g., 2024-03-21T15:00:00Z)" 
                });
            }
            if (deadlineDate <= new Date()) {
                return res.status(400).json({ 
                    message: "Submission deadline must be in the future" 
                });
            }
            updateData.submissionDeadline = deadlineDate;
        }

        if (updateData.timelineStartDate) {
            const startDate = new Date(updateData.timelineStartDate);
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({ 
                    message: "Invalid timeline start date format. Use ISO 8601 format" 
                });
            }
            updateData.timelineStartDate = startDate;
        }

        if (updateData.timelineEndDate) {
            const endDate = new Date(updateData.timelineEndDate);
            if (isNaN(endDate.getTime())) {
                return res.status(400).json({ 
                    message: "Invalid timeline end date format. Use ISO 8601 format" 
                });
            }
            updateData.timelineEndDate = endDate;
        }

        // Validate timeline dates relationship if both are provided
        if (updateData.timelineStartDate && updateData.timelineEndDate) {
            if (updateData.timelineEndDate <= updateData.timelineStartDate) {
                return res.status(400).json({ 
                    message: "Timeline end date must be after start date" 
                });
            }
        }

        // Validate category if it's being updated
        if (updateData.categoryId) {
            const category = await categoryRepository.findOne({ 
                where: { id: updateData.categoryId } 
            });
            if (!category) {
                return res.status(400).json({ message: "Invalid category" });
            }
        }

        // Remove any fields that shouldn't be updated
        delete updateData.id;
        delete updateData.createdById;
        delete updateData.createdAt;
        delete updateData.status;
        delete updateData.isPublished;
        delete updateData.creationTxUrl;
        delete updateData.publicationTxUrl;

        // Update the RFP
        Object.assign(rfp, updateData);
        const savedRfp = await rfpRepository.save(rfp);

        // Prepare the response with properly formatted dates
        const response = {
            ...savedRfp,
            submissionDeadline: savedRfp.submissionDeadline instanceof Date 
                ? savedRfp.submissionDeadline.toISOString() 
                : new Date(savedRfp.submissionDeadline).toISOString(),
            timelineStartDate: savedRfp.timelineStartDate instanceof Date 
                ? savedRfp.timelineStartDate.toISOString() 
                : new Date(savedRfp.timelineStartDate).toISOString(),
            timelineEndDate: savedRfp.timelineEndDate instanceof Date 
                ? savedRfp.timelineEndDate.toISOString() 
                : new Date(savedRfp.timelineEndDate).toISOString(),
            createdAt: savedRfp.createdAt instanceof Date 
                ? savedRfp.createdAt.toISOString() 
                : new Date(savedRfp.createdAt).toISOString(),
            updatedAt: savedRfp.updatedAt instanceof Date 
                ? savedRfp.updatedAt.toISOString() 
                : new Date(savedRfp.updatedAt).toISOString()
        };

        return res.json({
            message: "RFP updated successfully",
            data: response
        });
    } catch (error) {
        console.error("Update RFP error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// New endpoint for extracting RFP information from document
export const extractRfpInfo = async (req: AuthRequest, res: Response) => {
    if (!req.user || req.user.role !== UserRole.GPO) {
        return res.status(403).json({ message: "Only GPOs can use this feature" });
    }

    // Wrap multer upload in a Promise
    const handleUpload = () => {
        return new Promise<Express.Multer.File>((resolve, reject) => {
            upload(req, res, (err) => {
                if (err instanceof multer.MulterError) {
                    reject({
                        status: 400,
                        message: err.code === 'LIMIT_FILE_SIZE' 
                            ? 'File is too large. Maximum size is 10MB'
                            : 'Error uploading file',
                        error: err.code
                    });
                    return;
                } 
                
                if (err) {
                    reject({
                        status: 400,
                        message: err.message,
                        error: 'INVALID_FILE'
                    });
                    return;
                }

                if (!req.file) {
                    reject({
                        status: 400,
                        message: "No document provided"
                    });
                    return;
                }

                resolve(req.file);
            });
        });
    };

    try {
        // Handle file upload
        const file = await handleUpload();
        console.log("File uploaded successfully:", file.originalname);

        // Read the PDF file as a buffer
        const pdfBuffer = fs.readFileSync(file.path);
        
        // Extract text using pdf-parse
        const pdfData = await pdfParse(pdfBuffer);
        const fullText = pdfData.text;

        console.log("PDF content extracted successfully, length:", fullText.length);

        // Extract information using LLM
        const extractedInfo = await rfpGenerationService.extractRfpInfo(fullText);
        console.log("Information extracted successfully");

        // Clean up the uploaded file
        try {
            fs.unlinkSync(file.path);
        } catch (unlinkError) {
            console.error("Error cleaning up file:", unlinkError);
        }

        // Return the extracted information
        return res.json({
            message: "Information extracted successfully",
            data: {
                title: extractedInfo.title || null,
                shortDescription: extractedInfo.shortDescription || null,
                timeline: {
                    startDate: extractedInfo.timelineStartDate && extractedInfo.timelineStartDate instanceof Date && !isNaN(extractedInfo.timelineStartDate.getTime()) 
                        ? extractedInfo.timelineStartDate.toISOString() 
                        : null,
                    endDate: extractedInfo.timelineEndDate && extractedInfo.timelineEndDate instanceof Date && !isNaN(extractedInfo.timelineEndDate.getTime())
                        ? extractedInfo.timelineEndDate.toISOString()
                        : null
                },
                budget: extractedInfo.budget || null,
                issueDate: null, // This should be set when creating
                submissionDeadline: extractedInfo.submissionDeadline && extractedInfo.submissionDeadline instanceof Date && !isNaN(extractedInfo.submissionDeadline.getTime())
                    ? extractedInfo.submissionDeadline.toISOString()
                    : null,
                categoryId: null, // This needs manual selection
                technicalRequirements: extractedInfo.technicalRequirements || null,
                managementRequirements: extractedInfo.managementRequirements || null,
                pricingDetails: extractedInfo.pricingDetails || null,
                evaluationCriteria: extractedInfo.evaluationCriteria || null,
                specialInstructions: extractedInfo.specialInstructions || null
            }
        });
    } catch (error: any) {
        // Clean up the uploaded file in case of error
        if (req.file) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error("Error cleaning up file:", unlinkError);
            }
        }

        // If the error is from our upload handler, use its status code
        const status = error.status || 500;
        const message = error.message || "Internal server error";
        const errorDetails = error.error || "Unknown error";
        
        console.error("Document processing error:", {
            status,
            message,
            error: errorDetails,
            stack: error.stack
        });

        return res.status(status).json({ 
            message,
            error: errorDetails,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

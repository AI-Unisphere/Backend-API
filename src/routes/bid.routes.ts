import { Router } from "express";
import multer from "multer";
import path from "path";
import { submitBid, saveDraft, getBids, getBidById, analyzeBidProposal, downloadBidDocument } from "../controllers/bid.controller";
import { authenticateToken, authorize } from "../middleware/auth";
import { UserRole } from "../types/enums";

const router = Router();

// File upload configuration
const uploadConfig = {
    storage: multer.diskStorage({
        destination: 'uploads/proposals',
        filename: (_: any, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
            const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    },
    fileFilter: (_: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const isValidType = file.mimetype === 'application/pdf';
        const isValidExt = path.extname(file.originalname).toLowerCase() === '.pdf';
        const isValidName = file.originalname.length <= 255;

        if (!isValidType || !isValidExt) {
            cb(new Error('Only PDF files are allowed'));
            return;
        }

        if (!isValidName) {
            cb(new Error('File name is too long. Maximum 255 characters allowed'));
            return;
        }

        cb(null, true);
    }
};

const upload = multer(uploadConfig).single('proposalDocument');

// Error handler for file uploads
const handleUpload = (req: any, res: any, next: any) => {
    upload(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
            type ErrorResponse = { message: string; error: string; };
            const errorResponses: Record<string, ErrorResponse> = {
                LIMIT_FILE_SIZE: {
                    message: 'File is too large. Maximum size allowed is 10MB',
                    error: 'FILE_TOO_LARGE'
                },
                LIMIT_UNEXPECTED_FILE: {
                    message: 'Only one file can be uploaded at a time',
                    error: 'TOO_MANY_FILES'
                },
                LIMIT_FIELD_COUNT: {
                    message: 'Too many fields',
                    error: 'TOO_MANY_FIELDS'
                },
                LIMIT_FIELD_KEY: {
                    message: 'Field name too long',
                    error: 'FIELD_TOO_LONG'
                },
                LIMIT_FIELD_VALUE: {
                    message: 'Field value too long',
                    error: 'VALUE_TOO_LONG'
                },
                LIMIT_PART_COUNT: {
                    message: 'Too many parts',
                    error: 'TOO_MANY_PARTS'
                }
            };
            
            return res.status(400).json(errorResponses[err.code] || {
                message: `File upload error: ${err.message}`,
                error: 'UPLOAD_ERROR'
            });
        }
        
        if (err) {
            return res.status(400).json({
                message: err.message,
                error: 'INVALID_FILE'
            });
        }
        
        next();
    });
};

// Routes configuration
// Analyze bid proposal without saving (Vendor only)
router.post(
    "/rfp/:rfpId/analyze",
    authenticateToken,
    authorize([UserRole.VENDOR]),
    handleUpload,
    analyzeBidProposal
);

// Submit final bid (Vendor only)
router.post(
    "/rfp/:rfpId/submit",
    authenticateToken,
    authorize([UserRole.VENDOR]),
    handleUpload,
    submitBid
);

// Save bid as draft (Vendor only)
router.post(
    "/rfp/:rfpId/draft",
    authenticateToken,
    authorize([UserRole.VENDOR]),
    handleUpload,
    saveDraft
);

// List all bids for an RFP (GPO only, basic info visible before deadline)
router.get(
    "/rfp/:rfpId/list",
    authenticateToken,
    authorize([UserRole.GPO]),
    getBids
);

// Get specific bid details (GPO after deadline, or bid owner anytime)
router.get(
    "/rfp/:rfpId/bid/:id",
    authenticateToken,
    getBidById
);

// Download bid document (GPO after deadline, or bid owner anytime)
router.get(
    "/rfp/:rfpId/bid/:id/document",
    authenticateToken,
    downloadBidDocument
);

export default router; 
import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { businessVerificationService } from "../services/businessVerification.service";
import { emailService } from "../services/email.service";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../middleware/auth";
import { UserRole } from "../types/enums";

const userRepository = AppDataSource.getRepository(User);

export const requestVerification = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const user = await userRepository.findOne({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== UserRole.VENDOR) {
            return res.status(403).json({ message: "Only vendors can request verification" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Vendor is already verified" });
        }

        const { businessRegistrationNumber } = req.body;
        if (!businessRegistrationNumber) {
            return res.status(400).json({ message: "Business registration number is required" });
        }

        // Verify business through mock service
        const verificationResult = await businessVerificationService.verifyBusiness(businessRegistrationNumber);
        
        if (!verificationResult.isValid || !verificationResult.businessEmail) {
            return res.status(400).json({ 
                message: verificationResult.error || "Invalid business registration" 
            });
        }

        // Generate verification token
        const verificationToken = uuidv4();
        const tokenExpiry = new Date();
        tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

        // Update user with verification details
        user.businessRegistrationNumber = businessRegistrationNumber;
        user.businessEmail = verificationResult.businessEmail;
        user.verificationToken = verificationToken;
        user.verificationTokenExpiry = tokenExpiry;

        await userRepository.save(user);

        // Send verification email
        await emailService.sendVerificationEmail(verificationResult.businessEmail, verificationToken);

        return res.json({
            message: "Verification email sent to registered business email",
            businessEmail: verificationResult.businessEmail
        });

    } catch (error) {
        console.error("Verification request error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyBusiness = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const user = await userRepository.findOne({ 
            where: { verificationToken: token } 
        });

        if (!user) {
            return res.status(404).json({ message: "Invalid verification token" });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "Business is already verified" });
        }

        if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
            return res.status(400).json({ message: "Verification token has expired" });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpiry = null;

        await userRepository.save(user);

        return res.json({
            message: "Business verified successfully",
            isVerified: true
        });

    } catch (error) {
        console.error("Business verification error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}; 
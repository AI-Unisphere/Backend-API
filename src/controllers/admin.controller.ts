import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "../types/enums";

const userRepository = AppDataSource.getRepository(User);

export const initializeFirstGPO = async (req: Request, res: Response) => {
    try {
        // Check if any GPO exists
        const existingGPO = await userRepository.findOne({ where: { role: UserRole.GPO } });
        if (existingGPO) {
            return res.status(403).json({ 
                message: "System already initialized with a GPO account" 
            });
        }

        const { name, email, password } = req.body;

        // Check if email is already used
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create first GPO user
        const user = userRepository.create({
            name,
            email,
            password: hashedPassword,
            role: UserRole.GPO
        });

        await userRepository.save(user);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "24h" } // Token expires in 24 hours
        );

        return res.status(201).json({
            message: "First GPO account created successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("First GPO creation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const createGPO = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create GPO user
        const user = userRepository.create({
            name,
            email,
            password: hashedPassword,
            role: UserRole.GPO
        });

        await userRepository.save(user);

        return res.status(201).json({
            message: "GPO account created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("GPO creation error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}; 
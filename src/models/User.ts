import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { UserRole } from "../types/enums";

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    name!: string;

    @Column({ nullable: true })
    businessName?: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    password!: string;

    @Column({
        type: "enum",
        enum: UserRole
    })
    role!: UserRole;

    @Column({ nullable: true })
    businessRegistrationNumber?: string;

    @Column({ default: false })
    isVerified!: boolean;

    @Column({ type: "varchar", nullable: true })
    verificationToken?: string | null;

    @Column({ type: "timestamp", nullable: true })
    verificationTokenExpiry?: Date | null;

    @Column({ nullable: true })
    businessEmail?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 
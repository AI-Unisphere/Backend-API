import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User";
import { Rfp } from "./Rfp";

export enum BidStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED"
}

@Entity("bids")
export class Bid {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Rfp)
    @JoinColumn({ name: "rfpId" })
    rfp!: Rfp;

    @Column()
    rfpId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "vendorId" })
    vendor!: User;

    @Column()
    vendorId!: string;

    @Column()
    proposalDocument!: string;

    @Column({
        type: "enum",
        enum: BidStatus,
        default: BidStatus.DRAFT
    })
    status!: BidStatus;

    @Column({ default: false })
    aiCheckPerformed!: boolean;

    @Column({ type: "text", nullable: true })
    aiSuggestions?: string;

    // New evaluation fields
    @Column({ type: "decimal", precision: 5, scale: 2, nullable: true })
    evaluationScore?: number;

    @Column({ type: "text", nullable: true })
    shortEvaluation?: string;

    @Column({ type: "text", nullable: true })
    longEvaluation?: string;

    @Column({ type: "jsonb", nullable: true })
    evaluationDetails?: {
        costEffectiveness: number;
        timeline: number;
        compliance: number;
        projectOverview: number;
        supplierQualifications: number;
        pricing: number;
        managementPlan: number;
        productEffectiveness: number;
        complianceMatrix: number;
        rfpAlignment: number;
        comments: {
            costEffectiveness?: string[];
            timeline?: string[];
            compliance?: string[];
            projectOverview?: string[];
            supplierQualifications?: string[];
            pricing?: string[];
            managementPlan?: string[];
            productEffectiveness?: string[];
            complianceMatrix?: string[];
            rfpAlignment?: string[];
        };
    };

    @Column({ type: "timestamp", nullable: true })
    evaluationDate?: Date;

    @Column({ type: "timestamp", nullable: true })
    submissionDate?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 
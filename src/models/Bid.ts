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

    @Column({ type: "timestamp", nullable: true })
    submissionDate?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { RfpCategory } from "./RfpCategory";
import { User } from "./User";
import { Contract } from "./Contract";
import { Bid } from "./Bid";

export enum RfpStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    CLOSED = "CLOSED"
}

@Entity("rfps")
export class Rfp {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    title!: string;

    @Column("text")
    shortDescription!: string;

    @Column("text")
    longDescription!: string;

    @Column("timestamp")
    timelineStartDate!: Date;

    @Column("timestamp")
    timelineEndDate!: Date;

    @Column("decimal", { precision: 10, scale: 2 })
    budget!: number;

    @Column("timestamp")
    issueDate!: Date;

    @Column("timestamp")
    submissionDeadline!: Date;

    @ManyToOne(() => RfpCategory)
    @JoinColumn({ name: "categoryId" })
    category!: RfpCategory;

    @Column()
    categoryId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "createdById" })
    createdBy!: User;

    @Column()
    createdById!: string;

    @Column({
        type: "enum",
        enum: RfpStatus,
        default: RfpStatus.DRAFT
    })
    status!: RfpStatus;

    @Column({ default: false })
    isPublished!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => Bid, bid => bid.rfp)
    bids!: Bid[];

    @ManyToOne(() => Contract, { nullable: true })
    @JoinColumn({ name: "awardedContractId" })
    awardedContract?: Contract;

    @Column({ nullable: true })
    awardedContractId?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "awardedVendorId" })
    awardedVendor?: User;

    @Column({ nullable: true })
    awardedVendorId?: string;

    @Column({ type: "timestamp", nullable: true })
    awardedDate?: Date;
} 
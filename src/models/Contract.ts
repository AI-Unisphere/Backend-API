import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Rfp } from "./Rfp";
import { User } from "./User";
import { Bid } from "./Bid";
import { ContractStatus } from "../types/enums";
import { Milestone } from "./Milestone";

@Entity("contracts")
export class Contract {
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

    @ManyToOne(() => Bid)
    @JoinColumn({ name: "bidId" })
    bid!: Bid;

    @Column()
    bidId!: string;

    @Column({
        type: "enum",
        enum: ContractStatus,
        default: ContractStatus.ACTIVE
    })
    status!: ContractStatus;

    @Column("timestamp")
    awardDate!: Date;

    @Column("timestamp")
    startDate!: Date;

    @Column("timestamp")
    endDate!: Date;

    @Column("decimal", { precision: 10, scale: 2 })
    totalValue!: number;

    @OneToMany(() => Milestone, milestone => milestone.contract)
    milestones!: Milestone[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 
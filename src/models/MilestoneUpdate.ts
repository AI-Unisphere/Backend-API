import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Milestone } from "./Milestone";
import { Contract } from "./Contract";
import { User } from "./User";
import { MilestoneStatus } from "../types/enums";

@Entity("milestone_updates")
export class MilestoneUpdate {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Milestone, milestone => milestone.updates)
    @JoinColumn({ name: "milestoneId" })
    milestone!: Milestone;

    @Column()
    milestoneId!: string;

    @ManyToOne(() => Contract)
    @JoinColumn({ name: "contractId" })
    contract!: Contract;

    @Column()
    contractId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "updatedById" })
    updatedBy!: User;

    @Column()
    updatedById!: string;

    @Column({
        type: "enum",
        enum: MilestoneStatus
    })
    status!: MilestoneStatus;

    @Column("text")
    details!: string;

    @Column("simple-array", { nullable: true })
    media?: string[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 
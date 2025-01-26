import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Contract } from "./Contract";
import { MilestoneUpdate } from "./MilestoneUpdate";
import { MilestoneStatus } from "../types/enums";

@Entity("milestones")
export class Milestone {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column()
    title!: string;

    @Column("text")
    description!: string;

    @Column("timestamp")
    dueDate!: Date;

    @Column({
        type: "enum",
        enum: MilestoneStatus,
        default: MilestoneStatus.NOT_STARTED
    })
    status!: MilestoneStatus;

    @ManyToOne(() => Contract, contract => contract.milestones)
    @JoinColumn({ name: "contractId" })
    contract!: Contract;

    @Column()
    contractId!: string;

    @OneToMany(() => MilestoneUpdate, update => update.milestone)
    updates!: MilestoneUpdate[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
} 
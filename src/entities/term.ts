import { BaseEntity, Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrdinalTerm, TermStatus } from "../enums";
import ClassSchedule from "./class_schedule";
import TimeConstraint from "./time_constraint";
import { IsEnum } from "class-validator";

@Entity()
export default class Term extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    startYear: number;

    @Column("enum", { enum: OrdinalTerm })
    @IsEnum(OrdinalTerm)
    term: OrdinalTerm;

    @Column("enum", { enum: TermStatus })
    @IsEnum(TermStatus)
    status: TermStatus;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @OneToMany((type?: any) => ClassSchedule, (cs: ClassSchedule) => cs.term)
    classSchedules: ClassSchedule[];

    @ManyToMany((type?: any) => TimeConstraint, (tc: TimeConstraint) => tc.term)
    timeConstraints: TimeConstraint[];
}

import { IsEnum } from "class-validator";
import { BaseEntity, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { OrdinalTerm, TermStatus } from "../enums";
import ClassSchedule from "./class_schedule";
import TimeConstraint from "./time_constraint";
import Notice from "./notice";

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

    @OneToMany((type?: any) => TimeConstraint, (tc: TimeConstraint) => tc.term)
    @JoinTable()
    timeConstraints: TimeConstraint[];

    @ManyToOne((type?: any) => Notice, (n: Notice) => n.term)
    @JoinTable()
    notices: Notice[];
}

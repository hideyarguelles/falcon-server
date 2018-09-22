import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MeetingDays, MeetingHours } from "../enums";
import { FacultyMember, Term } from "./";
import { IsEnum } from "class-validator";

@Entity()
export default class TimeConstraint extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    isAvailable: boolean;

    @Column()
    isPreferred: boolean;

    @Column("enum", { enum: MeetingDays })
    @IsEnum(MeetingDays)
    meetingDays: MeetingDays;

    @Column("enum", { enum: MeetingHours })
    @IsEnum(MeetingHours)
    meetingHours: MeetingHours;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.timeConstraints)
    facultyMember: FacultyMember;

    @ManyToOne((type?: any) => Term, (t: Term) => t.timeConstraints)
    term: Term;
}

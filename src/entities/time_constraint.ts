import { IsEnum, IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MeetingDays, MeetingHours } from "../enums";
import { FacultyMember, Term } from "./";
import AvailabilityType from "../enums/availability_type";

@Entity()
export default class TimeConstraint extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { enum: MeetingDays })
    @IsEnum(MeetingDays)
    meetingDays: MeetingDays;

    @Column("enum", { enum: MeetingHours })
    @IsEnum(MeetingHours)
    meetingHours: MeetingHours;


    @Column("enum", { enum : AvailabilityType })
    @IsEnum(AvailabilityType)
    availabilityType: AvailabilityType;

    @Column({ nullable: true })
    otherReason: string;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.timeConstraints)
    facultyMember: FacultyMember;

    @ManyToOne((type?: any) => Term, (t: Term) => t.timeConstraints)
    term: Term;
}

import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MeetingDays, MeetingHours } from "../enum";
import { FacultyMember, Term } from "./";

@Entity()
export default class TimeConstraint extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    isAvailable: boolean;

    @Column()
    isPreferred: boolean;

    @Column("enum", { enum: MeetingDays })
    meetingDays: MeetingDays;

    @Column("enum", { enum: MeetingHours })
    meetingHours: MeetingHours;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.timeConstraints)
    facultyMember: FacultyMember;

    @ManyToOne((type?: any) => Term, (t: Term) => t.timeConstraints)
    term: Term;
}

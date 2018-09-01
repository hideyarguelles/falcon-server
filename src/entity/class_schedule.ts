import { IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { MeetingDays, MeetingHours } from "../enum";
import { FacultyMember, Subject } from "./";

@Entity()
export default class ClassSchedule extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { enum: MeetingDays })
    meetingDays: MeetingDays;

    @Column("enum", { enum: MeetingHours })
    meetingHours: MeetingHours;

    @Column()
    @IsNotEmpty()
    room: string;

    @Column()
    enrollmentCap: number;

    @Column()
    course: string;

    @Column()
    section: string;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.assignedClassSchedules)
    assignedFacultyMember: FacultyMember;

    @ManyToOne((type?: any) => Subject, (s: Subject) => s.classSchedules)
    subject: Subject;
}

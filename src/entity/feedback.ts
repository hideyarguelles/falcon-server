import { IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn, OneToOne } from "typeorm";
import { MeetingDays, MeetingHours, FeedbackStatus } from "../enum";
import { FacultyMember, Subject } from "./";
import ClassSchedule from "./class_schedule";

@Entity()
export default class FacultyMemberClassFeedback extends BaseEntity {
    @Column("enum", { enum: FeedbackStatus })
    status: FeedbackStatus;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm, {
        onDelete: "CASCADE"
    })
    facultyMember: FacultyMember;

    @OneToOne((type?: any) => ClassSchedule, (cs: ClassSchedule) => cs.feedback, {
        onDelete: "CASCADE",
    })
    classSchedule: ClassSchedule;
}

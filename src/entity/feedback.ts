import { BaseEntity, Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { FeedbackStatus } from "../enum";
import { FacultyMember } from "./";
import ClassSchedule from "./class_schedule";
import { IsEnum } from "class-validator";

@Entity()
export default class FacultyMemberClassFeedback extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { enum: FeedbackStatus })
    @IsEnum(FeedbackStatus)
    status: FeedbackStatus;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm, {
        onDelete: "CASCADE",
    })
    facultyMember: FacultyMember;

    @OneToOne((type?: any) => ClassSchedule, (cs: ClassSchedule) => cs.feedback, {
        onDelete: "CASCADE",
    })
    classSchedule: ClassSchedule;
}

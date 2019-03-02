import { IsNotEmpty, IsEnum } from "class-validator";
import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { MeetingDays, MeetingHours } from "../enums";
import { Subject, Term, FacultyMemberClassFeedback } from "./";

@Entity()
export default class ClassSchedule extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { enum: MeetingDays })
    @IsEnum(MeetingDays)
    meetingDays: MeetingDays;

    @Column("enum", { enum: MeetingHours })
    @IsEnum(MeetingHours)
    meetingHours: MeetingHours;

    @Column()
    @IsNotEmpty()
    room: string;

    @Column()
    course: string;

    @Column()
    section: string;

    @Column()
    studentYear: string;

    @Column()
    forAdjunct: boolean;

    @Column({ nullable: true })
    adjunctName?: string;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => Subject, (s: Subject) => s.classSchedules, { onDelete: "CASCADE" })
    subject: Subject;

    @OneToOne(
        (type?: any) => FacultyMemberClassFeedback,
        (fmcf: FacultyMemberClassFeedback) => fmcf.classSchedule,
        { onDelete: "SET NULL" },
    )
    @JoinColumn()
    feedback: FacultyMemberClassFeedback;

    @ManyToOne((type?: any) => Term, (t: Term) => t.classSchedules, {
        onDelete: "CASCADE",
    })
    term: Term;
}

import { IsNotEmpty } from "class-validator";
import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { MeetingDays, MeetingHours } from "../enum";
import { Subject, Term, FacultyMemberClassFeedback } from "./";

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

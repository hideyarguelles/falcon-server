import { IsNotEmpty } from "class-validator";
import {
    BaseEntity,
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    OneToOne,
    JoinColumn,
} from "typeorm";
import { MeetingDays, MeetingHours } from "../enum";
import { FacultyMember, Subject } from "./";
import FacultyMemberClassFeedback from "./feedback";

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
}

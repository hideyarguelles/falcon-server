import { IsNotEmpty } from "class-validator";
import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToMany,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { ActivityType, FacultyMemberType, Sex } from "../enum";
import {
    Degree,
    ExtensionWork,
    InstructionalMaterial,
    Presentation,
    Recognition,
    Subject,
    TimeConstraint,
    User,
} from "./";
import ClassSchedule from "./class_schedule";
import FacultyMemberClassFeedback from "./feedback";

export interface FacultyMemberForm {
    sex: Sex;
    type: FacultyMemberType;
    activity: ActivityType;
    birthDate: string;
    user: User;
}

@Entity()
export default class FacultyMember extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { enum: Sex })
    sex: Sex;

    @Column("enum", { enum: FacultyMemberType })
    type: FacultyMemberType;

    @Column("enum", { enum: ActivityType })
    activity: ActivityType;

    @Column("date")
    @IsNotEmpty()
    birthDate: string;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @OneToOne(type => User, {
        onDelete: "CASCADE",
    })
    @JoinColumn()
    user: User;

    @ManyToMany((type?: any) => Subject, (s: Subject) => s.specializedFaculty)
    specializedSubjects: Subject[];

    @OneToMany(
        (type?: any) => FacultyMemberClassFeedback,
        (fmcf: FacultyMemberClassFeedback) => fmcf.facultyMember,
    )
    classScheduleFeedbacks: FacultyMemberClassFeedback[];

    @OneToMany((type?: any) => TimeConstraint, (tc: TimeConstraint) => tc.facultyMember)
    timeConstraints: TimeConstraint[];

    //
    // ─── Subdocuments ───────────────────────────────────────────────────────────────────────────
    //

    @OneToMany((type?: any) => Presentation, (p: Presentation) => p.facultyMember)
    presentations: Presentation[];

    @OneToMany((type?: any) => Recognition, (r: Recognition) => r.facultyMember)
    recognitions: Recognition[];

    @OneToMany(
        (type?: any) => InstructionalMaterial,
        (im: InstructionalMaterial) => im.facultyMember,
    )
    instructionalMaterials: InstructionalMaterial[];

    @OneToMany((type?: any) => ExtensionWork, (ew: ExtensionWork) => ew.facultyMember)
    extensionWorks: ExtensionWork[];

    @OneToMany((type?: any) => Degree, (d: Degree) => d.facultyMember)
    degrees: Degree[];
}

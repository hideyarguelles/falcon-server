import { IsEnum, IsISO8601, IsNotEmpty } from "class-validator";
import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { ActivityType, FacultyMemberType, Sex } from "../enums";
import {
    Degree,
    ExtensionWork,
    InstructionalMaterial,
    Presentation,
    Recognition,
    TimeConstraint,
    User,
} from "./";
import FacultyMemberClassFeedback from "./feedback";

@Entity()
export default class FacultyMember extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("enum", { enum: Sex })
    @IsEnum(Sex)
    sex: Sex;

    @Column("enum", { enum: FacultyMemberType })
    @IsEnum(FacultyMemberType)
    type: FacultyMemberType;

    @Column("enum", { enum: ActivityType })
    @IsEnum(ActivityType)
    activity: ActivityType;

    @Column("date")
    @IsISO8601()
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

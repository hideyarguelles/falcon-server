import { IsNotEmpty, IsEnum } from "class-validator";
import { BaseEntity, Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { SubjectCategory } from "../enum";
import { FacultyMember } from "./";
import ClassSchedule from "./class_schedule";

@Entity()
export default class Subject extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    code: string;

    @Column()
    @IsNotEmpty()
    name: string;

    @Column()
    @IsNotEmpty()
    description: string;

    @Column("enum", { enum: SubjectCategory })
    @IsEnum(SubjectCategory)
    category: SubjectCategory;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToMany((type?: any) => FacultyMember, (fm: FacultyMember) => fm.specializedSubjects)
    specializedFaculty: FacultyMember[];

    @OneToMany((type?: any) => ClassSchedule, (cs: ClassSchedule) => cs.subject)
    classSchedules: ClassSchedule[];
}

import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToMany, OneToMany } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { FacultyMember } from "./";
import { SubjectCategory } from "../enum";
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
    category: SubjectCategory;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToMany((type?: any) => FacultyMember, (fm: FacultyMember) => fm.specializedSubjects)
    specializedFaculty: FacultyMember[];

    @OneToMany((type?: any) => ClassSchedule, (cs: ClassSchedule) => cs.subject)
    classSchedules: ClassSchedule[];
}

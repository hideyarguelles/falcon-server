import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { FacultyMember } from "./faculty_member";
import { SubjectCategory } from "../enum";

@Entity()
export class Subject extends BaseEntity {
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

    @ManyToMany((type?: any) => FacultyMember, (fm: FacultyMember) => fm.specializedSubjects)
    specializedFaculty: FacultyMember[];
}

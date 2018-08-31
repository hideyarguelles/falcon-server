import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { FacultyMember } from "./faculty_member";
import { DegreeLevel } from "../enum";

@Entity()
export class Degree extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column("enum", { enum: DegreeLevel })
    level: DegreeLevel;

    @Column()
    @IsNotEmpty()
    completionYear: string;

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.degrees)
    facultyMember: FacultyMember;
}

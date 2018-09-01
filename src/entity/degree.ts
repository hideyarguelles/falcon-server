import { IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DegreeLevel } from "../enum";
import { FacultyMember } from "./";

@Entity()
export default class Degree extends BaseEntity {
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

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.degrees)
    facultyMember: FacultyMember;
}

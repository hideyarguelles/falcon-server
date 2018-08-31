import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { FacultyMember } from "./";
import { DegreeLevel } from "../enum";

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

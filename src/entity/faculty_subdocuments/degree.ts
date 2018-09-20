import { IsEnum, IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { DegreeLevel } from "../../enum";
import FacultyMember from "../faculty_member";

export interface DegreeForm {}

@Entity()
export default class Degree extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column("enum", { enum: DegreeLevel })
    @IsEnum(DegreeLevel)
    level: DegreeLevel;

    @Column()
    @IsNotEmpty()
    completionYear: string;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.degrees, {
        onDelete: "CASCADE",
    })
    facultyMember: FacultyMember;
}

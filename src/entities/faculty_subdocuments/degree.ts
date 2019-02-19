import { IsEnum, IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { DegreeLevel } from "../../enums";
import FacultySubdocumentEntity from "../../interfaces/faculty_subdocument";
import FacultyMember from "../faculty_member";

export interface DegreeForm {}

@Entity()
export default class Degree extends FacultySubdocumentEntity {
    @Column("enum", { enum: DegreeLevel })
    @IsEnum(DegreeLevel)
    level: DegreeLevel;

    @Column({ nullable: true })
    completionYear?: string;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.degrees, {
        onDelete: "CASCADE",
    })
    facultyMember: FacultyMember;
}

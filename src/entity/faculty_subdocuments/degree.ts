import { IsEnum, IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { DegreeLevel } from "../../enum";
import FacultyMemberSubdocumentEntity from "../../interfaces/faculty_subdocument";
import FacultyMember from "../faculty_member";

export interface DegreeForm {}

@Entity()
export default class Degree extends FacultyMemberSubdocumentEntity {
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

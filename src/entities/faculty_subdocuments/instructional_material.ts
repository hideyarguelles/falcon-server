import { IsEnum, IsNotEmpty, IsNumberString, Max, Min } from "class-validator";
import { Column, Entity, ManyToOne } from "typeorm";
import { InstructionalMaterialAudience, InstructionalMaterialMedium } from "../../enums";
import FacultySubdocumentEntity from "../../interfaces/faculty_subdocument";
import FacultyMember from "../faculty_member";

export interface InstructionalMaterialForm {}

@Entity()
export default class InstructionalMaterial extends FacultySubdocumentEntity {
    @Column("enum", { enum: InstructionalMaterialMedium })
    @IsEnum(InstructionalMaterialMedium)
    medium: InstructionalMaterialMedium;

    @Column("enum", { enum: InstructionalMaterialAudience })
    @IsEnum(InstructionalMaterialAudience)
    audience: InstructionalMaterialAudience;

    @Column()
    @IsNotEmpty()
    @IsNumberString()
    usageYear: string;

    @Column({ nullable: true })
    @Min(1)
    @Max(4)
    level: number;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.instructionalMaterials, {
        onDelete: "CASCADE",
    })
    facultyMember: FacultyMember;
}

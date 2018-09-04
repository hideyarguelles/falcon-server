import { IsEnum, IsNotEmpty, IsNumberString, Max, Min } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FacultyMember } from "..";
import { InstructionalMaterialAudience, InstructionalMaterialMedium } from "../../enum";

@Entity()
export default class InstructionalMaterial extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

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

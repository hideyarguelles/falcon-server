import { IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { InstructionalMaterialAudience, InstructionalMaterialMedium } from "../enum";
import { FacultyMember } from "./";

@Entity()
export default class InstructionalMaterial extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column("enum", { enum: InstructionalMaterialMedium })
    medium: InstructionalMaterialMedium;

    @Column("enum", { enum: InstructionalMaterialAudience })
    audience: InstructionalMaterialAudience;

    @Column()
    @IsNotEmpty()
    usageYear: string;

    @Column({ nullable: true })
    level: number;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.instructionalMaterials)
    facultyMember: FacultyMember;
}

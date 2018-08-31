import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { InstructionalMaterialMedium, InstructionalMaterialAudience } from "../enum";
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

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.instructionalMaterials)
    facultyMember: FacultyMember;
}

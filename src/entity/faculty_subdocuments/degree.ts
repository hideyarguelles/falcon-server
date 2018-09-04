import { IsEnum, IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FacultyMember } from "..";
import { DegreeLevel } from "../../enum";

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

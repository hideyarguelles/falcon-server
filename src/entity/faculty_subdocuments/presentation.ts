import { IsNotEmpty, IsEnum } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PresentationCategory, PresentationMedium } from "../../enum";
import FacultyMember from "../faculty_member";

export interface PresentationForm {}

@Entity()
export default class Presentation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column("enum", { enum: PresentationCategory })
    @IsEnum(PresentationCategory)
    category: PresentationCategory;

    @Column()
    @IsNotEmpty()
    date: string;

    @Column()
    @IsNotEmpty()
    sponsor: string;

    @Column()
    @IsNotEmpty()
    venue: string;

    @Column()
    @IsNotEmpty()
    conference: string;

    @Column("enum", { enum: PresentationMedium })
    @IsEnum(PresentationMedium)
    medium: PresentationMedium;

    @Column()
    daysDuration: number;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.recognitions, {
        onDelete: "CASCADE",
    })
    facultyMember: FacultyMember;
}

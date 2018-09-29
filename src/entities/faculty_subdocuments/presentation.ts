import { IsEnum, IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PresentationCategory, PresentationMedium } from "../../enums";
import FacultySubdocumentEntity from "../../interfaces/faculty_subdocument";
import FacultyMember from "../faculty_member";

export interface PresentationForm {}

@Entity()
export default class Presentation extends FacultySubdocumentEntity {
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

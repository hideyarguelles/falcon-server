import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { PresentationCategory, PresentationMedium } from "../enum";
import { FacultyMember } from "./faculty_member";

@Entity()
export class Presentation extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column("enum", { enum: PresentationCategory })
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
    medium: PresentationMedium;

    @Column()
    daysDuration: number;

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.recognitions)
    facultyMember: FacultyMember;
}

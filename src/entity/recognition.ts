import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { RecognitionBasis } from "../enum";
import { FacultyMember } from "./faculty_member";

@Entity()
export class Recognition extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column("enum", { enum: RecognitionBasis })
    basis: RecognitionBasis;

    @Column()
    @IsNotEmpty()
    date: string;

    @Column()
    @IsNotEmpty()
    sponsor: string;

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.recognitions)
    facultyMember: FacultyMember;
}

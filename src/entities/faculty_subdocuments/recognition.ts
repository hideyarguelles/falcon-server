import { IsEnum, IsISO8601, IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RecognitionBasis } from "../../enums";
import FacultySubdocumentEntity from "../../interfaces/faculty_subdocument";
import FacultyMember from "../faculty_member";

export interface RecognitionForm {}

@Entity()
export default class Recognition extends FacultySubdocumentEntity {
    @Column("enum", { enum: RecognitionBasis })
    @IsEnum(RecognitionBasis)
    basis: RecognitionBasis;

    @Column()
    @IsNotEmpty()
    @IsISO8601()
    date: string;

    @Column()
    @IsNotEmpty()
    sponsor: string;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.recognitions, {
        onDelete: "CASCADE",
    })
    facultyMember: FacultyMember;
}

import { IsNotEmpty, IsEnum, IsISO8601 } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RecognitionBasis } from "../../enum";
import { FacultyMember } from "..";

@Entity()
export default class Recognition extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

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

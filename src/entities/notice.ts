import { Entity, PrimaryGeneratedColumn, BaseEntity, Column, ManyToOne } from "typeorm";
import { IsNotEmpty } from "class-validator";
import Term from "./term";
import FacultyMember from "./faculty_member";

@Entity()
export default class Notice extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    message: string;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //
    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.notices)
    facultyMember: FacultyMember;

    @ManyToOne((type?: any) => Term, (t: Term) => t.notices)
    term: Term;
}

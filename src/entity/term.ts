import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToMany } from "typeorm";
import { IsNotEmpty } from "class-validator";
import { TermStatus, OrdinalTerm } from "../enum";
import FacultyMember from "./faculty_member";

@Entity()
export default class Term extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    startYear: number;

    @Column("enum", { enum: OrdinalTerm })
    term: OrdinalTerm;

    @Column("enum", { enum: TermStatus })
    status: TermStatus;

    @ManyToMany((type?: any) => FacultyMember, (fm: FacultyMember) => fm.involvedTerms)
    facultyPool: FacultyMember[];
}

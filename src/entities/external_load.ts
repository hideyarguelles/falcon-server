import { BaseEntity, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import FacultyMember from "./faculty_member";
import Term from "./term";

@Entity()
export default class ExternalLoad extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //
    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.externalLoads)
    facultyMember: FacultyMember;

    @ManyToOne((type?: any) => Term, (t: Term) => t.externalLoads)
    term: Term;
}

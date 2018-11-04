import { BaseEntity, Entity, ManyToOne } from "typeorm";
import FacultyMember from "./faculty_member";
import Term from "./term";

@Entity()
export default class ExternalLoad extends BaseEntity {
    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //
    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.timeConstraints)
    facultyMember: FacultyMember;

    @ManyToOne((type?: any) => Term, (t: Term) => t.externalLoads)
    term: Term;
}

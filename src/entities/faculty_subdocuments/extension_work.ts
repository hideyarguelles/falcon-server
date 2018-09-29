import { ArrayUnique, IsArray, IsNotEmpty } from "class-validator";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ExtensionWorkRole } from "../../enums";
import FacultySubdocumentEntity from "../../interfaces/faculty_subdocument";
import IsEnumArray from "../../utils/is_enum_array";
import FacultyMember from "../faculty_member";

export interface ExtensionWorkForm {}

@Entity()
export default class ExtensionWork extends FacultySubdocumentEntity {
    @Column("enum", { enum: ExtensionWorkRole, array: true })
    @IsEnumArray(ExtensionWorkRole)
    @ArrayUnique()
    @IsArray()
    roles: ExtensionWorkRole[];

    @Column()
    @IsNotEmpty()
    venue: string;

    //
    // ─── Relations ──────────────────────────────────────────────────────────────────
    //

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.extensionWorks, {
        onDelete: "CASCADE",
    })
    facultyMember: FacultyMember;
}

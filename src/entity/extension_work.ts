import { IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ExtensionWorkRole } from "../enum";
import { FacultyMember } from "./";

@Entity()
export default class ExtensionWork extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column("enum", { enum: ExtensionWorkRole, array: true })
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

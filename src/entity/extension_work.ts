import { BaseEntity, Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { IsNotEmpty } from "class-validator";
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

    @ManyToOne((type?: any) => FacultyMember, (fm: FacultyMember) => fm.extensionWorks)
    facultyMember: FacultyMember;
}

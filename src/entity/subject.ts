import { IsEnum, IsNotEmpty } from "class-validator";
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { SubjectCategory } from "../enum";
import Program from "../enum/program";
import ClassSchedule from "./class_schedule";

@Entity()
export default class Subject extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    code: string;

    @Column()
    @IsNotEmpty()
    name: string;

    @Column()
    @IsNotEmpty()
    description: string;

    @Column("enum", { enum: SubjectCategory })
    @IsEnum(SubjectCategory)
    category: SubjectCategory;

    @Column("enum", { enum: Program })
    @IsEnum(Program)
    program: Program;

    //
    // ─── Relations ───────────────────────────────────────────────────────────────────────────
    //

    @OneToMany((type?: any) => ClassSchedule, (cs: ClassSchedule) => cs.subject)
    classSchedules: ClassSchedule[];
}

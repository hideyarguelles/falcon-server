import { ArrayUnique, IsArray, IsNotEmpty } from "class-validator";
import { BaseEntity, Column, PrimaryGeneratedColumn } from "typeorm";
import Program from "../enums/program";
import IsEnumArray from "../utils/is_enum_array";

export default abstract class FacultySubdocumentEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    @IsNotEmpty()
    title: string;

    @Column("enum", { enum: Program, array: true })
    @IsEnumArray(Program)
    @ArrayUnique()
    @IsArray()
    associatedPrograms: Program[];
}

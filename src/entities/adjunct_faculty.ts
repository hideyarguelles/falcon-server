import { Entity, BaseEntity, Column, PrimaryGeneratedColumn } from "typeorm"; "class-validator";

@Entity()
export default class AdjunctFaculty extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
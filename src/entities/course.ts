import { Entity, BaseEntity, Column, PrimaryGeneratedColumn } from "typeorm";m "class-validator";

@Entity()
export default class Course extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
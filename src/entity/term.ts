import { BaseEntity, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrdinalTerm, TermStatus } from "../enum";
import TimeConstraint from "./time_constraint";

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

    @ManyToMany((type?: any) => TimeConstraint, (tc: TimeConstraint) => tc.term)
    timeConstraints: TimeConstraint[];
}

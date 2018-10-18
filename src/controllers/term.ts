import { validate } from "class-validator";
import { EntityManager, FindOneOptions, getManager } from "typeorm";
import { ClassSchedule, FacultyMember, Term, TimeConstraint } from "../entities";
import { TermForm } from "../entities/forms/term";
import { ActivityType, TermStatus } from "../enums";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";
import FacultyLoadingFacultyMemberItem from "../interfaces/faculty_loading_faculty_member";

export default class TermController implements Controller {
    async findById(id: number, options?: FindOneOptions): Promise<Term> {
        const fm = await Term.findOne(id, options);

        if (!fm) {
            throw new EntityNotFoundError(`Could not find ${Term.name} of id ${id}`);
        }

        return fm;
    }

    async getAll(): Promise<Term[]> {
        return await Term.find();
    }

    async get(id: number): Promise<Term> {
        return await this.findById(id, {
            relations: [
                "classSchedules",
                "classSchedules.subject",
                "classSchedules.feedback",
                "classSchedules.feedback.facultyMember",
                "timeConstraints",
                "timeConstraints.facultyMember",
            ],
        });
    }

    async add(form: TermForm): Promise<Term> {
        const newTerm = Term.create({
            ...form,
            status: TermStatus.Initializing,
        });

        const formErrors = await validate(newTerm);
        if (formErrors.length > 0) {
            throw new ValidationFailError(formErrors);
        }

        // Archive every other term on new term creation
        const otherTerms = await Term.find();
        otherTerms.forEach(t => (t.status = TermStatus.Archived));

        await getManager().transaction(async (transactionEm: EntityManager) => {
            await transactionEm.save(otherTerms);
            await transactionEm.save(newTerm);
        });

        return newTerm;
    }

    async getFacultyMembers(id: number) {
        const term = await this.findById(id);
        const facultyMembers = await FacultyMember.find({
            where: {
                activity: ActivityType.Active,
            },
            relations: ["user"],
        });

        return await Promise.all(
            facultyMembers.map(
                async fm =>
                    ({
                        facultyId: fm.id,
                        firstName: fm.user.firstName,
                        lastName: fm.user.lastName,
                        pnuId: fm.pnuId,
                        type: fm.type,

                        classSchedules: await getManager()
                            .createQueryBuilder(ClassSchedule, "classSchedule")
                            .leftJoinAndSelect("classSchedule.term", "term")
                            .leftJoinAndSelect("classSchedule.feedback", "feedback")
                            .leftJoinAndSelect("feedback.facultyMember", "facultyMember")
                            .where("facultyMember.id = :id", { id: fm.id })
                            .andWhere("term.id = :id", { id: term.id })
                            .getMany(),

                        timeConstraints: await getManager()
                            .createQueryBuilder(TimeConstraint, "timeConstraint")
                            .leftJoinAndSelect("timeConstraint.facultyMember", "facultyMember")
                            .leftJoinAndSelect("timeConstraint.term", "term")
                            .where("facultyMember.id = :id", { id: fm.id })
                            .andWhere("term.id = :id", { id: term.id })
                            .getMany(),
                    } as FacultyLoadingFacultyMemberItem),
            ),
        );
    }
}

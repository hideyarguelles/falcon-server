import Controller from "../interfaces/controller";
import { Term } from "../entities";
import EntityNotFoundError from "../errors/not_found";
import { FindOneOptions, getManager, EntityManager } from "typeorm";
import { TermForm } from "../entities/forms/term";
import { TermStatus } from "../enums";
import { validate } from "class-validator";
import ValidationFailError from "../errors/validation_fail_error";

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
}

import Controller from "../interfaces/controller";
import { Term } from "../entities";
import EntityNotFoundError from "../errors/not_found";
import { FindOneOptions } from "typeorm";

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
                "timeConstraints.facultyMember"
            ]
        })
    }
}
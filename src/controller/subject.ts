import { validate } from "class-validator";
import { FindOneOptions } from "typeorm";
import { Subject } from "../entity";
import SubjectForm from "../entity/subject";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";

export default class SubjectController implements Controller {
    async findById(id: number, options?: FindOneOptions): Promise<Subject> {
        const subject = await Subject.findOne(id, options);

        if (!subject) {
            throw new EntityNotFoundError(id, Subject.name);
        }

        return subject;
    }

    async getAll(): Promise<Subject[]> {
        return await Subject.find();
    }

    async get(id: number): Promise<Subject> {
        return await this.findById(id);
    }

    async add(subjectForm: SubjectForm): Promise<Subject> {
        const newSubject = await Subject.create(subjectForm);
        const formErrors = await validate(newSubject);

        if (formErrors.length > 0) {
            throw new ValidationFailError(formErrors);
        }

        await newSubject.save();
        return newSubject;
    }

    async update(id: number, subjectForm: SubjectForm): Promise<Subject> {
        const subject = await this.findById(id);
        Object.assign(subject, subjectForm);
        const formErrors = await validate(subject);

        if (formErrors.length > 0) {
            throw new ValidationFailError(formErrors);
        }

        await subject.save();
        return subject;
    }
}

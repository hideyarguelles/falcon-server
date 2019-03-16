import { validate } from "class-validator";
import { FindOneOptions } from "typeorm";
import { Subject, Course } from "../entities";
import SubjectForm from "../entities/subject";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";

export default class SubjectController implements Controller {
    async findById(id: number, options?: FindOneOptions): Promise<Subject> {
        const subject = await Subject.findOne(id, options);

        if (!subject) {
            throw new EntityNotFoundError(`Could not find ${Subject.name} of id ${id}`);
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

    async getCourses(): Promise<string[]> {
        const courses = await Course.find();
        return courses.map(c => c.name);
    }
}

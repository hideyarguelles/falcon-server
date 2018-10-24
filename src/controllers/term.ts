import { validate } from "class-validator";
import { EntityManager, FindOneOptions, getManager } from "typeorm";
import { ClassSchedule, FacultyMember, Term, TimeConstraint } from "../entities";
import { ClassScheduleForm } from "../entities/forms/class_schedule";
import { TermForm } from "../entities/forms/term";
import Subject from "../entities/subject";
import { ActivityType, TermStatus } from "../enums";
import { getStatusForLoadAmount } from "../enums/load_amount_status";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";
import FacultyLoadingClassScheduleItem from "../interfaces/faculty_loading_class_schedule";
import FacultyLoadingFacultyMemberItem from "../interfaces/faculty_loading_faculty_member";

export default class TermController implements Controller {
    async findTermById(id: number, options?: FindOneOptions): Promise<Term> {
        const fm = await Term.findOne(id, options);

        if (!fm) {
            throw new EntityNotFoundError(`Could not find ${Term.name} of id ${id}`);
        }

        return fm;
    }

    async findSubjectById(id: number, options?: FindOneOptions): Promise<Subject> {
        const s = await Subject.findOne(id, options);

        if (!s) {
            throw new EntityNotFoundError(`Could not find ${Subject.name} of id ${id}`);
        }

        return s;
    }

    async getAll(): Promise<Term[]> {
        return await Term.find();
    }

    async get(id: number): Promise<Term> {
        return await this.findTermById(id, {
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

    async addClassSchedule(
        termId: number,
        form: ClassScheduleForm,
    ): Promise<FacultyLoadingClassScheduleItem> {
        const term = await this.findTermById(termId, { relations: ["classSchedules"] });
        const subject = await this.findSubjectById(form.subject);
        const newClassSchedule = ClassSchedule.create({ ...form, subject, term });

        const formErrors = await validate(newClassSchedule);
        if (formErrors.length > 0) {
            throw new ValidationFailError(formErrors);
        }

        term.classSchedules.push(newClassSchedule);
        await newClassSchedule.save();
        await term.save();

        return {
            id: newClassSchedule.id,
            meetingDays: newClassSchedule.meetingDays,
            meetingHours: newClassSchedule.meetingHours,
            room: newClassSchedule.room,
            section: newClassSchedule.section,
            course: newClassSchedule.course,

            subjectName: subject.name,
            subjectCode: subject.code,
            subjectDescription: subject.description,
            subjectCategory: subject.category,
            subjectProgram: subject.program,
        };
    }

    async getFacultyMembers(termId: number): Promise<FacultyLoadingFacultyMemberItem[]> {
        const term = await this.findTermById(termId);
        const fms = await FacultyMember.find({
            where: {
                activity: ActivityType.Active,
            },
            relations: ["user"],
        });

        const facultyMembers = await Promise.all(
            fms.map(
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

        facultyMembers.forEach(fm => {
            fm.loadAmountStatus = getStatusForLoadAmount(fm.type, fm.classSchedules.length);
        });

        return facultyMembers;
    }

    async getClassSchedules(termId: number): Promise<FacultyLoadingClassScheduleItem[]> {
        const term = await this.findTermById(termId);
        const css = await ClassSchedule.find({
            where: { term },
            relations: [
                "subject",
                "feedback",
                "feedback.facultyMember",
                "feedback.facultyMember.user",
            ],
        });

        return css.map(cs => ({
            id: cs.id,
            meetingDays: cs.meetingDays,
            meetingHours: cs.meetingHours,
            room: cs.room,
            section: cs.section,
            course: cs.course,

            subjectName: cs.subject.name,
            subjectCode: cs.subject.code,
            subjectDescription: cs.subject.description,
            subjectCategory: cs.subject.category,
            subjectProgram: cs.subject.program,

            facultyMember: !cs.feedback
                ? undefined
                : {
                      id: cs.feedback.facultyMember.id,
                      firstName: cs.feedback.facultyMember.user.firstName,
                      lastName: cs.feedback.facultyMember.user.lastName,
                      pnuId: cs.feedback.facultyMember.pnuId,
                      type: cs.feedback.facultyMember.type,
                  },
        }));
    }
}

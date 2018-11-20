import { validate } from "class-validator";
import { EntityManager, FindOneOptions, getManager, Not } from "typeorm";
import {
    ClassSchedule,
    FacultyMember,
    FacultyMemberClassFeedback,
    Term,
    TimeConstraint,
    User,
} from "../entities";
import { ClassScheduleForm } from "../entities/forms/class_schedule";
import { TermForm } from "../entities/forms/term";
import Notice from "../entities/notice";
import Subject from "../entities/subject";
import { ActivityType, FeedbackStatus, TermStatus } from "../enums";
import { getStatusForLoadAmount } from "../enums/load_amount_status";
import { nextStatus, previousStatus } from "../enums/term_status";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";
import FacultyLoadingClassScheduleItem from "../interfaces/faculty_loading_class_schedule";
import FacultyLoadingFacultyMemberItem from "../interfaces/faculty_loading_faculty_member";
import FacultyProfile from "../interfaces/faculty_profile";
import SchedulerController from "./scheduler";

const formatClassSchedule = (cs: ClassSchedule) => ({
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
              feedback: cs.feedback.status,
          },
});

const formatNotice = (n: Notice) => ({
    id: n.id,
    message: n.message,
    facultyId: n.facultyMember.id,
    facultyFirstName: n.facultyMember.user.firstName,
    facultyLastName: n.facultyMember.user.lastName,
});

type FeedbackForm = { [key: number]: FeedbackStatus };

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

    async get(id: number) {
        const term = await this.findTermById(id, {
            relations: [
                "classSchedules",
                "classSchedules.subject",
                "classSchedules.feedback",
                "classSchedules.feedback.facultyMember",
                "classSchedules.feedback.facultyMember.user",
                "timeConstraints",
                "timeConstraints.facultyMember",
            ],
        });
        const notices = await Notice.find({
            relations: ["facultyMember", "facultyMember.user"],
            where: {
                term: {
                    id: term.id,
                },
            },
        });

        return {
            ...term,
            classSchedules: term.classSchedules.map(formatClassSchedule),
            notices: notices.map(formatNotice),
        };
    }

    async advance() {
        async function clearForPublishing(t: Term) {
            const faculties = await FacultyMember.find({
                activity: ActivityType.Active,
            });
            const scheduleController = new SchedulerController();
            let unassignedFacultyCount: any = faculties.map(
                async f => await scheduleController.numberOfAssignments(f, t),
            );
            unassignedFacultyCount = await Promise.all(unassignedFacultyCount);
            unassignedFacultyCount = unassignedFacultyCount.filter(c => c === 0).length;

            if (unassignedFacultyCount > 0) {
                throw new Error(
                    `Cannot publish schedule: ${unassignedFacultyCount} faculty members still unassigned`,
                );
            }

            let unassignedClassesCount: any = await ClassSchedule.find({
                where: {
                    term: {
                        id: t.id,
                    },
                },
            });
            unassignedClassesCount = unassignedClassesCount.filter(c => !Boolean(c.feedback))
                .length;
            if (unassignedClassesCount > 0) {
                throw new Error(
                    `Cannot publish schedule: ${unassignedClassesCount} classes still unassigned`,
                );
            }
        }

        async function clearForScheduling() {
            const [_, classSchedulesCount] = await ClassSchedule.findAndCount({
                where: {
                    term: {
                        id: t.id,
                    },
                },
            });

            if (classSchedulesCount === 0) {
                throw new Error(`Cannot move to scheduling: No classes in term`);
            }
        }

        const t = await Term.findOne({
            where: {
                status: Not(TermStatus.Archived),
            },
        });
        const potentialNextStatus = nextStatus(t.status);

        switch (potentialNextStatus) {
            case TermStatus.Published:
                await clearForPublishing(t);
                break;
            case TermStatus.Scheduling:
                await clearForScheduling();
                break;
        }

        t.status = potentialNextStatus;
        await t.save();
        return this.get(t.id);
    }

    async regress() {
        const t = await Term.findOne({
            where: {
                status: Not(TermStatus.Archived),
            },
        });
        t.status = previousStatus(t.status);
        await t.save();
        return this.get(t.id);
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

    async autoAssign(): Promise<FacultyLoadingClassScheduleItem[]> {
        const currentTerm = await Term.findOne({
            where: {
                status: TermStatus.Scheduling,
            },
            relations: [
                "externalLoads",
                "classSchedules",
                "classSchedules.subject",
                "timeConstraints",
                "timeConstraints.facultyMember",
            ],
        });

        await new SchedulerController().makeSchedule(currentTerm);
        return await this.getClassSchedules(currentTerm.id);
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

        return formatClassSchedule(newClassSchedule);
    }

    async getFacultyMembers(termId: number): Promise<FacultyLoadingFacultyMemberItem[]> {
        const term = await this.findTermById(termId, {
            relations: [
                "timeConstraints",
                "timeConstraints.facultyMember",
                "classSchedules",
                "classSchedules.subject",
                "classSchedules.feedback",
                "classSchedules.feedback.facultyMember",
            ],
        });

        const fms = await FacultyMember.find({
            where: {
                activity: ActivityType.Active,
            },
            relations: ["user"],
        });

        const facultyMembers = fms.map(
            fm =>
                ({
                    facultyId: fm.id,
                    firstName: fm.user.firstName,
                    lastName: fm.user.lastName,
                    pnuId: fm.pnuId,
                    type: fm.type,

                    classSchedules: term.classSchedules
                        .filter(cs => Boolean(cs.feedback))
                        .filter(cs => cs.feedback.facultyMember.id === fm.id),

                    timeConstraints: term.timeConstraints.filter(
                        tc => tc.facultyMember.id === fm.id,
                    ),
                } as FacultyLoadingFacultyMemberItem),
        );

        facultyMembers.forEach(fm => {
            fm.loadAmountStatus = getStatusForLoadAmount(fm.type, fm.classSchedules.length);
        });

        return facultyMembers;
    }

    async getMySchedule(termId: number, user: User): Promise<FacultyLoadingFacultyMemberItem> {
        const term = await this.findTermById(termId, {
            relations: [
                "timeConstraints",
                "timeConstraints.facultyMember",
                "classSchedules",
                "classSchedules.subject",
                "classSchedules.feedback",
                "classSchedules.feedback.facultyMember",
            ],
        });
        const fm = await FacultyMember.findOne({ where: { user }, relations: ["user"] });

        if (!fm) {
            throw new EntityNotFoundError(
                "Could not find corresponding faculty member for current user",
            );
        }

        const classSchedules = term.classSchedules
            .filter(cs => Boolean(cs.feedback))
            .filter(cs => cs.feedback.facultyMember.id === fm.id);

        const timeConstraints = term.timeConstraints.filter(tc => tc.facultyMember.id === fm.id);

        return {
            facultyId: fm.id,
            firstName: fm.user.firstName,
            lastName: fm.user.lastName,
            pnuId: fm.pnuId,
            type: fm.type,
            classSchedules,
            timeConstraints,
            loadAmountStatus: getStatusForLoadAmount(fm.type, classSchedules.length),
        };
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

        return css.map(formatClassSchedule);
    }

    async setMyTimeConstraints(termId: number, user: User, form: any): Promise<TimeConstraint[]> {
        const term = await this.findTermById(termId);
        const facultyMember = await FacultyMember.findOne({ where: { user }, relations: ["user"] });
        if (!facultyMember) {
            throw new EntityNotFoundError(
                "Could not find corresponding faculty member for current user",
            );
        }

        await TimeConstraint.delete({
            facultyMember: {
                id: facultyMember.id,
            },
            term: {
                id: termId,
            },
        });

        const tcs = form.timeConstraints.map((tc: any) =>
            TimeConstraint.create({
                meetingHours: tc.meetingHours,
                meetingDays: tc.meetingDays,
                isPreferred: tc.isPreferred,
                term,
                facultyMember,
            }),
        );

        await Promise.all(tcs.map(async tc => await tc.save()));
        return tcs;
    }

    async getNotices(termId: Term) {
        const notices = await Notice.find({
            relations: ["faculty", "faculty.user"],
            where: {
                term: {
                    id: termId,
                },
            },
        });

        return notices.map(formatNotice);
    }

    async setNotice(termId: number, user: User, message: string) {
        const term = await this.findTermById(termId);
        const facultyMember = await FacultyMember.findOne({ where: { user }, relations: ["user"] });

        const notice = Notice.create({
            term,
            facultyMember,
            message,
        });

        await notice.save();
        return notice;
    }

    async removeNotice(termId: number, noticeId: number) {
        const notice = await Notice.findOne(noticeId);
        await Notice.remove(notice);
    }

    async setFeedback(
        termId: number,
        feedback: FeedbackForm,
        user: User,
    ): Promise<FacultyLoadingFacultyMemberItem> {
        const classSchedules = await ClassSchedule.findByIds(Object.keys(feedback), {
            relations: ["feedback"],
        });

        for (const cs of classSchedules) {
            cs.feedback.status = feedback[cs.id];
            await cs.feedback.save();
            await cs.save();
        }

        return await this.getMySchedule(termId, user);
    }

    async setFaculty(
        termId: number,
        classScheduleId: number,
        facultyId: number,
    ): Promise<FacultyLoadingClassScheduleItem> {
        const classSchedule = await ClassSchedule.findOne(classScheduleId, {
            relations: ["subject", "term"],
        });
        const facultyMember = await FacultyMember.findOne(facultyId, {
            relations: ["user"],
        });

        // Unassign from conflicts
        const [conflicts, conflictsCount] = await ClassSchedule.findAndCount({
            relations: ["feedback", "feedback.facultyMember"],
            where: {
                meetingDays: classSchedule.meetingDays,
                meetingHours: classSchedule.meetingHours,
                term: {
                    id: classSchedule.term.id,
                },
            },
        });

        console.log("Conflicts", conflictsCount);
        const conflictsPromise = conflicts
            .filter(cs => cs.feedback && cs.feedback.facultyMember.id === facultyMember.id)
            .map(async cs => {
                await FacultyMemberClassFeedback.remove(cs.feedback);
            });

        const fmcf = FacultyMemberClassFeedback.create({
            facultyMember,
            classSchedule,
            status: FeedbackStatus.Pending,
        });

        classSchedule.feedback = fmcf;
        await fmcf.save();
        await Promise.all(conflictsPromise);
        await classSchedule.save();

        return formatClassSchedule(classSchedule);
    }

    async getRecommendedFaculties(
        classScheduleId: number,
        termId: number,
    ): Promise<FacultyProfile[]> {
        const classSchedule = await ClassSchedule.findOne(classScheduleId, {
            relations: ["subject"],
        });
        const term = await this.findTermById(termId, {
            relations: [
                "externalLoads",
                "classSchedules",
                "classSchedules.subject",
                "timeConstraints",
                "timeConstraints.facultyMember",
            ],
        });

        const candidates = await new SchedulerController().candidatesForClassSchedule(
            classSchedule,
            term,
        );
        return candidates.map(c => ({
            id: c.faculty.id,
            sex: c.faculty.sex,
            type: c.faculty.type,
            activity: c.faculty.activity,
            birthDate: c.faculty.birthDate,
            pnuId: c.faculty.pnuId,
            firstName: c.faculty.user.firstName,
            lastName: c.faculty.user.lastName,
            email: c.faculty.user.email,
        }));
    }
}

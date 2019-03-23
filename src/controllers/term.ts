import { validate } from "class-validator";
import * as _ from "lodash";
import { EntityManager, FindOneOptions, getManager, Not } from "typeorm";
import {
    ClassSchedule,
    Degree,
    ExtensionWork,
    FacultyMember,
    FacultyMemberClassFeedback,
    InstructionalMaterial,
    Presentation,
    Recognition,
    Term,
    TimeConstraint,
    User,
    Course,
} from "../entities";
import { ParentClassSchedulesForm } from "../entities/forms/class_schedule";
import { TermForm } from "../entities/forms/term";
import Notice from "../entities/notice";
import Subject from "../entities/subject";
import {
    ActivityType,
    FacultyMemberType,
    FeedbackStatus,
    TermStatus,
    UserType,
    OrdinalTerm,
} from "../enums";
import LoadAmountStatus, { getStatusForLoadAmount } from "../enums/load_amount_status";
import { nextStatus, previousStatus } from "../enums/term_status";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";
import FacultyLoadingClassScheduleItem from "../interfaces/faculty_loading_class_schedule";
import FacultyLoadingFacultyMemberItem from "../interfaces/faculty_loading_faculty_member";
import { facultyMemberToProfile } from "./faculty_member";
import { candidatesForClassSchedule, makeSchedule, numberOfAssignments } from "./scheduler";
import AdjunctFaculty from "../entities/adjunct_faculty";

const formatClassSchedule = (cs: ClassSchedule) => ({
    id: cs.id,
    meetingDays: cs.meetingDays,
    meetingHours: cs.meetingHours,
    room: cs.room,
    section: cs.section,
    course: cs.course,
    studentYear: cs.studentYear,
    forAdjunct: cs.forAdjunct,
    adjunctName: cs.adjunctName,

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

const formatFacultyLoadingFacultyMemberItem = (
    fm: FacultyMember,
    classSchedules: ClassSchedule[],
    timeConstraints: TimeConstraint[],
): FacultyLoadingFacultyMemberItem => {
    const loadAmountStatus = getStatusForLoadAmount(fm.type, classSchedules.length);
    const ongoingSubdocuments = [
        ...fm.degrees,
        ...fm.presentations,
        ...fm.instructionalMaterials,
        ...fm.extensionWorks,
        ...fm.recognitions,
    ]
        .filter(subd => subd.ongoing)
        .map(subd => {
            let type = subd.constructor.name;

            switch (type) {
                case Degree.name:
                    type = "Degree";
                    break;
                case Presentation.name:
                    type = "Presentation";
                    break;
                case InstructionalMaterial.name:
                    type = "Instructional Material";
                    break;
                case ExtensionWork.name:
                    type = "Extension Work";
                    break;
                case Recognition.name:
                    type = "Recognition";
                    break;
            }

            return {
                title: subd.title,
                type,
            };
        });

    return {
        facultyId: fm.id,
        firstName: fm.user.firstName,
        lastName: fm.user.lastName,
        pnuId: fm.pnuId,
        type: fm.type,
        classSchedules,
        timeConstraints,
        loadAmountStatus,
        ongoingSubdocuments,
    };
};

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

    async facultyMemberStats() {
        const term = await Term.findOne({
            relations: [
                "classSchedules",
                "classSchedules.feedback",
                "classSchedules.feedback.facultyMember",
                "classSchedules.subject",
                "timeConstraints",
                "timeConstraints.facultyMember",
            ],
        });

        const stats = {
            activity: {
                active: 0,
                inactive: 0,
            },
            load: {},
            rank: {},
        };

        // Prefill with values for load
        Object.keys(LoadAmountStatus).forEach(las => {
            stats.load[las] = [];
        });

        // Prefill with values for rank
        Object.keys(FacultyMemberType).forEach(fmt => {
            stats.rank[fmt] = 0;
        });

        const facultyMembers = await FacultyMember.find({
            relations: ["user"],
            where: {
                activity: ActivityType.Active,
            },
        });

        stats.activity.active = facultyMembers.filter(
            f => f.activity === ActivityType.Active,
        ).length;
        stats.activity.inactive = facultyMembers.length - stats.activity.active;

        facultyMembers.forEach(fm => {
            // Count load status
            const classes = term.classSchedules
                .filter(cs => Boolean(cs.feedback))
                .filter(cs => cs.feedback.facultyMember.id === fm.id);

            const status = getStatusForLoadAmount(fm.type, classes.length);
            stats.load[status].push(facultyMemberToProfile(fm));

            // Count rank
            stats.rank[fm.type]++;
        });

        return stats;
    }

    async advance() {
        async function clearForPublishing(t: Term) {
            const faculties = await FacultyMember.find({
                activity: ActivityType.Active,
            });
            let unassignedFacultyCount: any = faculties.map(
                async f => await numberOfAssignments(f, t),
            );
            unassignedFacultyCount = await Promise.all(unassignedFacultyCount);
            unassignedFacultyCount = unassignedFacultyCount.filter(c => c === 0).length;

            if (unassignedFacultyCount > 0) {
                throw new Error(
                    `Cannot publish schedule: ${unassignedFacultyCount} faculty members still unassigned`,
                );
            }

            let unassignedClassesCount: any = await ClassSchedule.find({
                relations: ["feedback"],
                where: {
                    term: {
                        id: t.id,
                    },
                    forAdjunct: false,
                },
            });

            unassignedClassesCount = unassignedClassesCount.filter(c => !c.feedback).length;

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
                "classSchedules",
                "classSchedules.subject",
                "classSchedules.feedback",
                "classSchedules.feedback.facultyMember",
                "timeConstraints",
                "timeConstraints.facultyMember",
            ],
        });

        await makeSchedule(currentTerm);
        return await this.getClassSchedules(currentTerm.id);
    }

    async addClassSchedule(
        termId: number,
        form: ParentClassSchedulesForm,
    ): Promise<FacultyLoadingClassScheduleItem[]> {
        const term = await this.findTermById(termId, { relations: ["classSchedules"] });
        const subject = await this.findSubjectById(form.subjectId);

        let classSchedules = form.classSchedules.map(child =>
            ClassSchedule.create({ ...child, subject, term }),
        );

        let formErrors: any = classSchedules.map(async cs => await validate(cs));
        formErrors = await Promise.all(formErrors);

        if (!formErrors.every(fe => fe.length === 0)) {
            throw new ValidationFailError(formErrors);
        }

        let courses: any[] = await Course.find();
        courses = courses.map(c => c.name);

        const newCourses = classSchedules
            .map(cs => cs.course)
            .filter(c => !courses.includes(c))
            .map(c => Course.create({ name: c }))
            .map(async c => {
                await c.save();
            });

        classSchedules = await Promise.all(classSchedules.map(async cs => {
            term.classSchedules.push(cs);
            return await cs.save();
        }));

        await Promise.all([newCourses, classSchedules]);
        await term.save();

        return classSchedules.map(formatClassSchedule);
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

        const facultyFindOptions = {
            relations: [
                "user",
                "degrees",
                "recognitions",
                "presentations",
                "instructionalMaterials",
                "extensionWorks",
            ],
        };

        // If archived, show all available faculty members
        if (term.status !== TermStatus.Archived) {
            facultyFindOptions["where"] = {
                activity: ActivityType.Active,
            };
        }

        const fms = await FacultyMember.find(facultyFindOptions);

        return await Promise.all(
            fms.map(async fm => {
                const classSchedules = term.classSchedules
                    .filter(cs => Boolean(cs.feedback))
                    .filter(cs => cs.feedback.facultyMember.id === fm.id);
                const timeConstraints = term.timeConstraints.filter(
                    tc => tc.facultyMember.id === fm.id,
                );

                return formatFacultyLoadingFacultyMemberItem(fm, classSchedules, timeConstraints);
            }),
        );
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
        const fm = await FacultyMember.findOne({
            where: { user },
            relations: [
                "user",
                "degrees",
                "recognitions",
                "presentations",
                "instructionalMaterials",
                "extensionWorks",
            ],
        });

        if (!fm) {
            throw new EntityNotFoundError(
                "Could not find corresponding faculty member for current user",
            );
        }

        const classSchedules = term.classSchedules
            .filter(cs => Boolean(cs.feedback))
            .filter(cs => cs.feedback.facultyMember.id === fm.id);

        const timeConstraints = term.timeConstraints.filter(tc => tc.facultyMember.id === fm.id);

        return formatFacultyLoadingFacultyMemberItem(fm, classSchedules, timeConstraints);
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
                term,
                facultyMember,
                availabilityType: tc.availabilityType,
                otherReason: tc.otherReason,
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

        // Associate Dean classes are always accepted by default
        const status =
            facultyMember.user.authorization === UserType.AssociateDean
                ? FeedbackStatus.Accepted
                : FeedbackStatus.Pending;

        const fmcf = FacultyMemberClassFeedback.create({
            facultyMember,
            classSchedule,
            status,
        });

        classSchedule.feedback = fmcf;
        await fmcf.save();
        await Promise.all(conflictsPromise);
        await classSchedule.save();

        return formatClassSchedule(classSchedule);
    }

    async setAdjunct(
        termId: number,
        classScheduleId: number,
        adjunctName: string,
    ): Promise<FacultyLoadingClassScheduleItem> {
        const classSchedule = await ClassSchedule.findOne(classScheduleId, {
            relations: ["subject", "term"],
        });

        classSchedule.adjunctName = adjunctName;

        const adjunctFaculty = await AdjunctFaculty.findOne({
            where: {
                name: adjunctName,
            },
        });

        if (!adjunctFaculty) {
            await AdjunctFaculty.create({ name: adjunctName }).save();
        }

        await classSchedule.save();
        return formatClassSchedule(classSchedule);
    }

    async getUnderloadedFacultiesLastTerm(): Promise<any[]> {
        const relations = [
            "classSchedules",
            "classSchedules.feedback",
            "classSchedules.feedback.facultyMember",
        ];

        const currentTerm = await Term.findOne({
            where: {
                status: Not(TermStatus.Archived),
            },
            relations,
        });

        let lastTerm = undefined;
        const currentTermYear = Number(currentTerm.startYear);

        if (currentTerm.term === OrdinalTerm.First) {
            lastTerm = await Term.findOne({
                where: {
                    term: OrdinalTerm.Third,
                    startYear: currentTermYear - 1,
                },
                relations,
            });
        } else {
            lastTerm = await Term.findOne({
                where: {
                    term:
                        currentTerm.term === OrdinalTerm.Third
                            ? OrdinalTerm.Second
                            : OrdinalTerm.First,
                    startYear: currentTermYear,
                },
                relations,
            });
        }

        if (!lastTerm) {
            return [];
        }

        const classSchedules = lastTerm.classSchedules.filter(cs => Boolean(cs.feedback));
        let facultyMembers = classSchedules.map(cs => cs.feedback.facultyMember);
        facultyMembers = _.uniqBy(facultyMembers, "id");

        return facultyMembers
            .filter(fm => {
                const facultyCs = classSchedules.filter(
                    cs => cs.feedback.facultyMember.id === fm.id,
                );
                const status = getStatusForLoadAmount(fm.type, facultyCs.length);
                return status === LoadAmountStatus.Underloaded;
            })
            .map(fm => fm.id);
    }

    async getTermsFromYear(year: number): Promise<any[]> {
        const terms = await Term.find({
            where: {
                startYear: year,
            },
            relations: [
                "classSchedules",
                "classSchedules.subject",
                "classSchedules.feedback",
                "classSchedules.feedback.facultyMember",
                "classSchedules.feedback.facultyMember.user",
            ],
        });

        return terms.map(t => ({
            ...t,
            classSchedules: t.classSchedules.map(formatClassSchedule),
        }));
    }

    async getRecommendedFaculties(classScheduleId: number, termId: number): Promise<any[]> {
        const classSchedule = await ClassSchedule.findOne(classScheduleId, {
            relations: ["subject"],
        });

        const term = await this.findTermById(termId, {
            relations: [
                "classSchedules",
                "classSchedules.subject",
                "classSchedules.feedback",
                "classSchedules.feedback.facultyMember",
                "timeConstraints",
                "timeConstraints.facultyMember",
            ],
        });

        const candidates = await candidatesForClassSchedule(classSchedule, term);

        return candidates.map(c => ({
            facultyMember: facultyMemberToProfile(c.facultyMember),
            pros: c.pros,
            cons: c.cons,
            errors: c.errors,
            score: c.score,
        }));
    }
}

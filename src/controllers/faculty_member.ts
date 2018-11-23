import { validate } from "class-validator";
import { EntityManager, FindOneOptions, getManager } from "typeorm";
import { FacultyMember, User, ClassSchedule } from "../entities";
import { FacultyMemberForm } from "../entities/forms/faculty_member";
import { UserForm } from "../entities/forms/user";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";
import { FeedbackStatus, ActivityType, TermStatus } from "../enums";
import * as _ from "lodash";
import FacultyProfile from "../interfaces/faculty_profile";

function facultyMemberToProfile(fm) {
    return {
        id: fm.id,
        sex: fm.sex,
        type: fm.type,
        activity: fm.activity,
        birthDate: fm.birthDate,
        pnuId: fm.pnuId,
        firstName: fm.user.firstName,
        lastName: fm.user.lastName,
        email: fm.user.email,
    };
}

export default class FacultyMemberController implements Controller {
    async findById(id: number, options?: FindOneOptions): Promise<FacultyMember> {
        const fm = await FacultyMember.findOne(id, options);

        if (!fm) {
            throw new EntityNotFoundError(`Could not find ${FacultyMember.name} of id ${id}`);
        }

        return fm;
    }

    async findByUserId(userId: number): Promise<FacultyProfile> {
        const fm = await FacultyMember.findOne({
            where: {
                user: {
                    id: userId,
                },
            },
            relations: [
                "user",
                "presentations",
                "recognitions",
                "instructionalMaterials",
                "extensionWorks",
                "degrees",
            ],
        });

        if (!fm) {
            throw new EntityNotFoundError(
                `Could not find ${FacultyMember.name} with user id ${userId}`,
            );
        }

        return {
            id: fm.id,
            sex: fm.sex,
            type: fm.type,
            activity: fm.activity,
            birthDate: fm.birthDate,
            pnuId: fm.pnuId,
            firstName: fm.user.firstName,
            lastName: fm.user.lastName,
            email: fm.user.email,
            presentations: fm.presentations,
            recognitions: fm.recognitions,
            instructionalMaterials: fm.instructionalMaterials,
            extensionWorks: fm.extensionWorks,
            degrees: fm.degrees,
            taughtSubjects: await this.getTaughtSubjects(fm.id),
        };
    }

    async getAll(): Promise<FacultyProfile[]> {
        const fms = await FacultyMember.find({
            relations: ["user"],
        });

        return fms.map(facultyMemberToProfile);
    }

    async getAllActiveFaculties(): Promise<FacultyProfile[]> {
        const fms = await FacultyMember.find({
            where: {
                activity: ActivityType.Active,
            },
            relations: ["user"],
        });

        return fms.map(facultyMemberToProfile);
    }

    async getTaughtSubjects(facultyId: number): Promise<{ [key: string]: number }> {
        let cs = await ClassSchedule.find({
            relations: ["subject", "feedback", "feedback.facultyMember", "term"],
        });

        cs = cs.filter(
            c =>
                c.term.status === TermStatus.Archived &&
                c.feedback &&
                c.feedback.status === FeedbackStatus.Accepted &&
                c.feedback.facultyMember.id === facultyId,
        );

        const subjects = cs.map(cs => cs.subject.code);
        return _.countBy(subjects, s => s);
    }

    async get(id: number): Promise<FacultyProfile> {
        const fm = await this.findById(id, {
            relations: [
                "user",
                "presentations",
                "recognitions",
                "instructionalMaterials",
                "extensionWorks",
                "degrees",
            ],
        });

        return {
            id: fm.id,
            sex: fm.sex,
            type: fm.type,
            activity: fm.activity,
            birthDate: fm.birthDate,
            pnuId: fm.pnuId,
            firstName: fm.user.firstName,
            lastName: fm.user.lastName,
            email: fm.user.email,
            presentations: fm.presentations,
            recognitions: fm.recognitions,
            instructionalMaterials: fm.instructionalMaterials,
            extensionWorks: fm.extensionWorks,
            degrees: fm.degrees,
            taughtSubjects: await this.getTaughtSubjects(fm.id),
        };
    }

    async add(userForm: UserForm, facultyMemberForm: FacultyMemberForm): Promise<FacultyMember> {
        const newUser = await User.createFromForm(userForm);
        const userFormErrors = await validate(newUser);

        if (userFormErrors.length > 0) {
            throw new ValidationFailError(userFormErrors);
        }

        const newFacultyMember = FacultyMember.create(facultyMemberForm);
        newFacultyMember.user = newUser;
        const facultyMemberFormErrors = await validate(newFacultyMember);

        if (facultyMemberFormErrors.length > 0) {
            throw new ValidationFailError(facultyMemberFormErrors);
        }

        await getManager().transaction(async (transactionEM: EntityManager) => {
            await transactionEM.save(newUser);
            await transactionEM.save(newFacultyMember);
        });

        return newFacultyMember;
    }

    async update(
        id: number,
        userForm: UserForm,
        facultyMemberForm: FacultyMemberForm,
    ): Promise<FacultyProfile> {
        const facultyMember = await this.findById(id, {
            relations: ["user"],
        });

        const user = await User.findOne({
            where: {
                id: facultyMember.user.id,
            },
            select: [
                "id",
                "firstName",
                "lastName",
                "passwordIsTemporary",
                "authorization",
                "email",
            ],
        });
        Object.assign(user, userForm);
        const userFormErrors = await validate(user);

        if (userFormErrors.length > 0) {
            throw new ValidationFailError(userFormErrors);
        }

        Object.assign(facultyMember, facultyMemberForm);
        const facultyMemberFormErrors = await validate(facultyMember);

        if (facultyMemberFormErrors.length > 0) {
            throw new ValidationFailError(facultyMemberFormErrors);
        }

        await getManager().transaction(async (transactionEM: EntityManager) => {
            await transactionEM.save(user);
            await transactionEM.save(facultyMember);
        });

        return {
            id: facultyMember.id,
            sex: facultyMember.sex,
            type: facultyMember.type,
            activity: facultyMember.activity,
            birthDate: facultyMember.birthDate,
            pnuId: facultyMember.pnuId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };
    }
}

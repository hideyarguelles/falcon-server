import { validate } from "class-validator";
import { EntityManager, FindOneOptions, getManager } from "typeorm";
import { FacultyMember, User } from "../entities";
import { FacultyMemberForm } from "../entities/forms/faculty_member";
import { UserForm } from "../entities/forms/user";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";

export default class FacultyMemberController implements Controller {
    async findById(id: number, options?: FindOneOptions): Promise<FacultyMember> {
        const fm = await FacultyMember.findOne(id, options);

        if (!fm) {
            throw new EntityNotFoundError(`Could not find ${FacultyMember.name} of id ${id}`);
        }

        return fm;
    }

    async findByUserId(userId: number): Promise<FacultyMember> {
        const fm = FacultyMember.findOne({
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
                `Cloud not find ${FacultyMember.name} with user id ${userId}`,
            );
        }

        return fm;
    }

    async getAll(): Promise<FacultyMember[]> {
        return FacultyMember.find({
            relations: ["user"],
        });
    }

    async get(id: number): Promise<FacultyMember> {
        return await this.findById(id, {
            relations: [
                "user",
                "presentations",
                "recognitions",
                "instructionalMaterials",
                "extensionWorks",
                "degrees",
            ],
        });
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
    ): Promise<FacultyMember> {
        const facultyMember = await this.findById(id, {
            relations: [
                "user",
                "presentations",
                "recognitions",
                "instructionalMaterials",
                "extensionWorks",
                "degrees",
            ],
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

        facultyMember.user = user;

        return facultyMember;
    }
}

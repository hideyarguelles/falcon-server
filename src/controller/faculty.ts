import { validate } from "class-validator";
import { EntityManager, getManager } from "typeorm";
import { FacultyMember, User } from "../entity";
import { FacultyMemberForm } from "../entity/faculty_member";
import { UserForm } from "../entity/user";

export default class FacultyController {
    static async getAll(): Promise<FacultyMember[]> {
        return FacultyMember.find({ relations: ["user"] });
    }

    static async add(
        userForm: UserForm,
        facultyMemberForm: FacultyMemberForm,
    ): Promise<FacultyMember> {
        const newUser = await User.createFromForm(userForm);
        const userFormErrors = await validate(newUser);

        if (userFormErrors.length > 0) {
            throw userFormErrors;
        }

        const newFacultyMember = FacultyMember.create(facultyMemberForm);
        newFacultyMember.user = newUser;
        const facultyMemberFormErrors = await validate(newFacultyMember);

        if (facultyMemberFormErrors.length > 0) {
            throw facultyMemberFormErrors;
        }

        await getManager().transaction(async (transactionEM: EntityManager) => {
            await transactionEM.save(newUser);
            await transactionEM.save(newFacultyMember);
        });

        return newFacultyMember;
    }

    static async update(
        id: number,
        userForm: UserForm,
        facultyMemberForm: FacultyMemberForm,
    ): Promise<FacultyMember | void> {
        const facultyMember = await FacultyMember.findOne(id, { relations: ["user"] });

        if (!facultyMember) {
            return undefined;
        }

        const user = facultyMember.user;
        Object.assign(user, userForm);
        const userFormErrors = await validate(user);

        if (userFormErrors.length > 0) {
            throw userFormErrors;
        }

        Object.assign(facultyMember, facultyMemberForm);
        const facultyMemberFormErrors = await validate(facultyMember);

        if (facultyMemberFormErrors.length > 0) {
            throw facultyMemberFormErrors;
        }

        await getManager().transaction(async (transactionEM: EntityManager) => {
            await transactionEM.save(user);
            await transactionEM.save(facultyMember);
        });

        return facultyMember;
    }
}

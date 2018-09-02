import { validate } from "class-validator";
import { EntityManager, getManager } from "typeorm";
import { FacultyMember, User } from "../entity";
import { FacultyMemberForm } from "../entity/faculty_member";
import { UserForm } from "../entity/user";

export default class FacultyController {
    static async getAll(): Promise<FacultyMember[]> {
        return FacultyMember.find();
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
}

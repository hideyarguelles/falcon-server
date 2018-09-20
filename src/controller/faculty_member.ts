import { validate } from "class-validator";
import { EntityManager, FindOneOptions, getManager } from "typeorm";
import { FacultyMember, User } from "../entity";
import { FacultyMemberForm } from "../entity/faculty_member";
import { UserForm } from "../entity/user";
import EntityNotFoundError from "../errors/not_found";
import Controller from "../interfaces/controller";
import {
    DegreeController,
    ExtensionWorkController,
    InstructionalMaterialController,
    PresentationController,
    RecognitionController,
} from "./faculty_subdocuments";
import ValidationFailError from "../errors/validation_fail_error";

export default class FacultyMemberController implements Controller {
    async findById(id: number, options?: FindOneOptions): Promise<FacultyMember> {
        const facultyMember = await FacultyMember.findOne(id, options);

        if (!facultyMember) {
            throw new EntityNotFoundError(id, FacultyMember.name);
        }

        return facultyMember;
    }

    async getAll(): Promise<FacultyMember[]> {
        return FacultyMember.find();
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
    ): Promise<FacultyMember | void> {
        const facultyMember = await this.findById(id, { relations: ["user"] });
        const user = facultyMember.user;
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

        return facultyMember;
    }

    async getDegreeController(id: number): Promise<DegreeController> {
        const facultyMember = await this.findById(id);
        return new DegreeController(facultyMember);
    }

    async getExtensionWorkController(id: number): Promise<ExtensionWorkController> {
        const facultyMember = await this.findById(id);
        return new ExtensionWorkController(facultyMember);
    }

    async getInstructionalMaterialController(id: number): Promise<InstructionalMaterialController> {
        const facultyMember = await this.findById(id);
        return new InstructionalMaterialController(facultyMember);
    }

    async getPresentationController(id: number): Promise<PresentationController> {
        const facultyMember = await this.findById(id);
        return new PresentationController(facultyMember);
    }

    async getRecognitionController(id: number): Promise<RecognitionController> {
        const facultyMember = await this.findById(id);
        return new RecognitionController(facultyMember);
    }
}

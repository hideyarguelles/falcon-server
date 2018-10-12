import { validate } from "class-validator";
import { BaseEntity } from "typeorm";
import {
    Degree,
    ExtensionWork,
    FacultyMember,
    InstructionalMaterial,
    Presentation,
    Recognition,
} from "../entities";
import { DegreeForm } from "../entities/faculty_subdocuments/degree";
import { ExtensionWorkForm } from "../entities/faculty_subdocuments/extension_work";
import { InstructionalMaterialForm } from "../entities/faculty_subdocuments/instructional_material";
import { PresentationForm } from "../entities/faculty_subdocuments/presentation";
import { RecognitionForm } from "../entities/faculty_subdocuments/recognition";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";
import FacultyMemberController from "./faculty_member";

export abstract class FacultySubdocumentController<S extends BaseEntity, F> implements Controller {
    abstract createFromForm(form: F, fm: FacultyMember): S;
    abstract async findById(id: number): Promise<S>;

    async add(facultyId: number, form: F): Promise<S> {
        const facultyMember = await new FacultyMemberController().get(facultyId);
        const entity: S = this.createFromForm(form, facultyMember);
        const formErrors = await validate(entity);

        if (formErrors.length > 0) {
            throw new ValidationFailError(formErrors);
        }

        await facultyMember.save();
        await entity.save();

        return entity;
    }

    async update(id: number, form: F): Promise<S> {
        const entity = await this.findById(id);
        Object.assign(entity, form);
        const formErrors = await validate(entity);

        if (formErrors.length > 0) {
            throw new ValidationFailError(formErrors);
        }

        await entity.save();
        return entity;
    }

    async remove(id: number): Promise<void> {
        const entity = await this.findById(id);
        await entity.remove();
    }
}

export class DegreeController extends FacultySubdocumentController<Degree, DegreeForm> {
    createFromForm(form: DegreeForm, facultyMember: FacultyMember): Degree {
        const entity = Degree.create(form);
        entity.facultyMember = facultyMember;
        return entity;
    }

    async findById(id: number): Promise<Degree> {
        const entity = await Degree.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(`Could not find ${Degree.name} of id ${id}`);
        }
        return entity;
    }
}

export class RecognitionController extends FacultySubdocumentController<
    Recognition,
    RecognitionForm
> {
    createFromForm(form: RecognitionForm, facultyMember: FacultyMember): Recognition {
        const entity = Recognition.create(form);
        entity.facultyMember = facultyMember;
        return entity;
    }

    async findById(id: number): Promise<Recognition> {
        const entity = await Recognition.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(`Could not find ${Recognition.name} of id ${id}`);
        }
        return entity;
    }
}

export class InstructionalMaterialController extends FacultySubdocumentController<
    InstructionalMaterial,
    InstructionalMaterialForm
> {
    createFromForm(
        form: InstructionalMaterialForm,
        facultyMember: FacultyMember,
    ): InstructionalMaterial {
        const entity = InstructionalMaterial.create(form);
        entity.facultyMember = facultyMember;
        return entity;
    }

    async findById(id: number): Promise<InstructionalMaterial> {
        const entity = await InstructionalMaterial.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(
                `Could not find ${InstructionalMaterial.name} of id ${id}`,
            );
        }
        return entity;
    }
}

export class PresentationController extends FacultySubdocumentController<
    Presentation,
    PresentationForm
> {
    createFromForm(form: PresentationForm, facultyMember: FacultyMember): Presentation {
        const entity = Presentation.create(form);
        entity.facultyMember = facultyMember;
        return entity;
    }

    async findById(id: number): Promise<Presentation> {
        const entity = await Presentation.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(`Could not find ${Presentation.name} of id ${id}`);
        }
        return entity;
    }
}

export class ExtensionWorkController extends FacultySubdocumentController<
    ExtensionWork,
    ExtensionWorkForm
> {
    createFromForm(form: ExtensionWorkForm, facultyMember: FacultyMember): ExtensionWork {
        const entity = ExtensionWork.create(form);
        entity.facultyMember = facultyMember;
        return entity;
    }

    async findById(id: number): Promise<ExtensionWork> {
        const entity = await ExtensionWork.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(`Could not find ${ExtensionWork.name} of id ${id}`);
        }
        return entity;
    }
}

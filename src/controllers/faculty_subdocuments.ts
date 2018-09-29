import { validate } from "class-validator";
import { BaseEntity } from "typeorm";
import { Degree, ExtensionWork, FacultyMember, InstructionalMaterial, Presentation, Recognition } from "../entities";
import { DegreeForm } from "../entities/faculty_subdocuments/degree";
import { ExtensionWorkForm } from "../entities/faculty_subdocuments/extension_work";
import { InstructionalMaterialForm } from "../entities/faculty_subdocuments/instructional_material";
import { PresentationForm } from "../entities/faculty_subdocuments/presentation";
import { RecognitionForm } from "../entities/faculty_subdocuments/recognition";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import Controller from "../interfaces/controller";
import FacultyMemberController from "./faculty_member";

export abstract class FacultySubdocumentController<S extends BaseEntity, F>
    implements Controller {
    abstract getSubdocumentCollection(fm: FacultyMember): S[];
    abstract createFromForm(form: F): S;
    abstract async findById(id: number): Promise<S>;

    async add(facultyId: number, form: F): Promise<S> {
        const facultyMember = await new FacultyMemberController().get(facultyId);
        const entity: S = this.createFromForm(form);
        const formErrors = await validate(entity);

        if (formErrors.length > 0) {
            throw new ValidationFailError(formErrors);
        }

        const collection = this.getSubdocumentCollection(facultyMember);
        collection.push(entity);
        await facultyMember.save();

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
    getSubdocumentCollection(fm: FacultyMember): Degree[] {
        return fm.degrees;
    }

    createFromForm(form: DegreeForm): Degree {
        return Degree.create(form);
    }

    async findById(id: number): Promise<Degree> {
        const entity = await Degree.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(id, Degree.name);
        }
        return entity;
    }
}

export class RecognitionController extends FacultySubdocumentController<
    Recognition,
    RecognitionForm
> {
    getSubdocumentCollection(fm: FacultyMember): Recognition[] {
        return fm.recognitions;
    }

    createFromForm(form: RecognitionForm): Recognition {
        return Recognition.create(form);
    }

    async findById(id: number): Promise<Recognition> {
        const entity = await Recognition.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(id, Recognition.name);
        }
        return entity;
    }
}

export class InstructionalMaterialController extends FacultySubdocumentController<
    InstructionalMaterial,
    InstructionalMaterialForm
> {
    getSubdocumentCollection(fm: FacultyMember): InstructionalMaterial[] {
        return fm.instructionalMaterials;
    }

    createFromForm(form: InstructionalMaterialForm): InstructionalMaterial {
        return InstructionalMaterial.create(form);
    }

    async findById(id: number): Promise<InstructionalMaterial> {
        const entity = await InstructionalMaterial.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(id, InstructionalMaterial.name);
        }
        return entity;
    }
}

export class PresentationController extends FacultySubdocumentController<
    Presentation,
    PresentationForm
> {
    getSubdocumentCollection(fm: FacultyMember): Presentation[] {
        return fm.presentations;
    }

    createFromForm(form: RecognitionForm): Presentation {
        return Presentation.create(form);
    }

    async findById(id: number): Promise<Presentation> {
        const entity = await Presentation.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(id, Presentation.name);
        }
        return entity;
    }
}

export class ExtensionWorkController extends FacultySubdocumentController<
    ExtensionWork,
    ExtensionWorkForm
> {
    getSubdocumentCollection(fm: FacultyMember): ExtensionWork[] {
        return fm.extensionWorks;
    }

    createFromForm(form: RecognitionForm): ExtensionWork {
        return ExtensionWork.create(form);
    }

    async findById(id: number): Promise<ExtensionWork> {
        const entity = await ExtensionWork.findOne(id);
        if (!entity) {
            throw new EntityNotFoundError(id, ExtensionWork.name);
        }
        return entity;
    }
}

import { validate } from "class-validator";
import { BaseEntity } from "typeorm";
import { Degree, ExtensionWork, InstructionalMaterial, Presentation, Recognition } from "../entity";
import FacultyMember from "../entity/faculty_member";
import { DegreeForm } from "../entity/faculty_subdocuments/degree";
import { ExtensionWorkForm } from "../entity/faculty_subdocuments/extension_work";
import { InstructionalMaterialForm } from "../entity/faculty_subdocuments/instructional_material";
import { PresentationForm } from "../entity/faculty_subdocuments/presentation";
import { RecognitionForm } from "../entity/faculty_subdocuments/recognition";
import EntityNotFoundError from "../errors/not_found";
import Controller from "../interfaces/controller";
import ValidationFailError from "../errors/validation_fail_error";

export abstract class FacultyMemberSubdocumentControler<S extends BaseEntity, F>
    implements Controller {
    facultyMember: FacultyMember;

    constructor(parent: FacultyMember) {
        this.facultyMember = parent;
    }

    abstract getSubdocumentCollection(): S[];
    abstract createFromForm(form: F): S;
    abstract async findById(id: number): Promise<S>;

    async add(form: F): Promise<S> {
        const entity: S = this.createFromForm(form);
        const formErrors = await validate(entity);

        if (formErrors.length > 0) {
            throw new ValidationFailError(formErrors);
        }

        const collection = this.getSubdocumentCollection();
        collection.push(entity);
        await this.facultyMember.save();

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

export class DegreeController extends FacultyMemberSubdocumentControler<Degree, DegreeForm> {
    getSubdocumentCollection(): Degree[] {
        return this.facultyMember.degrees;
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

export class RecognitionController extends FacultyMemberSubdocumentControler<
    Recognition,
    RecognitionForm
> {
    getSubdocumentCollection(): Recognition[] {
        return this.facultyMember.recognitions;
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

export class InstructionalMaterialController extends FacultyMemberSubdocumentControler<
    InstructionalMaterial,
    InstructionalMaterialForm
> {
    getSubdocumentCollection(): InstructionalMaterial[] {
        return this.facultyMember.instructionalMaterials;
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

export class PresentationController extends FacultyMemberSubdocumentControler<
    Presentation,
    PresentationForm
> {
    getSubdocumentCollection(): Presentation[] {
        return this.facultyMember.presentations;
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

export class ExtensionWorkController extends FacultyMemberSubdocumentControler<
    ExtensionWork,
    ExtensionWorkForm
> {
    getSubdocumentCollection(): ExtensionWork[] {
        return this.facultyMember.extensionWorks;
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

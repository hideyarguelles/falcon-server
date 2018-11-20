import * as status from "http-status-codes";
import { Context } from "koa";
import {
    DegreeController,
    ExtensionWorkController,
    FacultySubdocumentController,
    InstructionalMaterialController,
    PresentationController,
    RecognitionController,
} from "../controllers/faculty_subdocuments";
import { UserType } from "../enums";
import View from "../interfaces/view";
import { RequireAuthorization } from "../utils/require_authorization";

export abstract class FacultySubdocumentView<
    C extends FacultySubdocumentController<any, any>
> extends View<C> {
    abstract paramId: string;
    abstract authorizedToAdd: UserType[];
    abstract authorizedToUpdate: UserType[];
    abstract authorizedToRemove: UserType[];

    @RequireAuthorization(this.authorizedToAdd)
    add = async (ctx: Context): Promise<void> => {
        const { facultyId, ...form } = ctx.request.body;
        await this.controller.add(facultyId, form).then(subdocument => {
            ctx.status = status.CREATED;
            ctx.body = subdocument;
        });
    };

    @RequireAuthorization(this.authorizedToUpdate)
    update = async (ctx: Context): Promise<void> => {
        const form = ctx.request.body;
        const subdocumentId = ctx.params[this.paramId];
        await this.controller.update(subdocumentId, form).then(subdocument => {
            ctx.status = status.OK;
            ctx.body = subdocument;
        });
    };

    @RequireAuthorization(this.authorizedToRemove)
    remove = async (ctx: Context): Promise<void> => {
        const subdocumentId = ctx.params[this.paramId];
        await this.controller.remove(subdocumentId).then(() => {
            ctx.status = status.NO_CONTENT;
        });
    };

    toggleOngoing = async (ctx: Context): Promise<void> => {
        const subdocumentId = ctx.params[this.paramId];
        await this.controller.toggleOngoing(subdocumentId).then(subdocument => {
            ctx.status = status.OK;
            ctx.body = subdocument;
        });
    };
}

export class DegreeView extends FacultySubdocumentView<DegreeController> {
    paramId = "degreeId";
    authorizedToAdd = [UserType.Clerk];
    authorizedToRemove = [UserType.Clerk];
    authorizedToUpdate = [UserType.Clerk];
}

export class RecognitionView extends FacultySubdocumentView<RecognitionController> {
    paramId = "recognitionId";
    authorizedToAdd = [UserType.Clerk];
    authorizedToRemove = [UserType.Clerk];
    authorizedToUpdate = [UserType.Clerk];
}

export class PresentationView extends FacultySubdocumentView<PresentationController> {
    paramId = "presentationId";
    authorizedToAdd = [UserType.Clerk, UserType.Faculty];
    authorizedToRemove = [UserType.Clerk, UserType.Faculty];
    authorizedToUpdate = [UserType.Clerk, UserType.Faculty];
}

export class InstructionalMaterialView extends FacultySubdocumentView<
    InstructionalMaterialController
> {
    paramId = "instructionalMaterialId";
    authorizedToAdd = [UserType.Clerk];
    authorizedToRemove = [UserType.Clerk];
    authorizedToUpdate = [UserType.Clerk];
}

export class ExtensionWorkView extends FacultySubdocumentView<ExtensionWorkController> {
    paramId = "extensionWorkId";
    authorizedToAdd = [UserType.Clerk];
    authorizedToRemove = [UserType.Clerk];
    authorizedToUpdate = [UserType.Clerk];
}

import * as status from "http-status-codes";
import { Context } from "koa";
import SubjectController from "../controllers/subject";
import SubjectForm from "../entities/subject";
import { UserType } from "../enum";
import View from "../interfaces/view";
import { handleControllerError } from "../utils/handle_controller_error";
import { RequireAuthorization } from "../utils/require_authorization";

export default class SubjectView extends View<SubjectController> {
    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk, UserType.Faculty])
    getAll = async (ctx: Context): Promise<void> => {
        await this.controller
            .getAll()
            .then(subjects => {
                ctx.status = status.OK;
                ctx.body = subjects;
            })
            .catch(handleControllerError(ctx));
    };

    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk, UserType.Faculty])
    get = async (ctx: Context): Promise<void> => {
        const { id } = ctx.params;
        await this.controller
            .get(id)
            .then(subject => {
                ctx.status = status.OK;
                ctx.body = subject;
            })
            .catch(handleControllerError(ctx));
    };

    @RequireAuthorization([UserType.Clerk])
    add = async (ctx: Context): Promise<void> => {
        const subjectForm: SubjectForm = ctx.request.body;
        await this.controller
            .add(subjectForm)
            .then(newSubject => {
                ctx.status = status.CREATED;
                ctx.body = newSubject;
            })
            .catch(handleControllerError(ctx));
    };

    @RequireAuthorization([UserType.Clerk])
    update = async (ctx: Context): Promise<void> => {
        const { id } = ctx.params;
        const subjectForm: SubjectForm = ctx.request.body;
        await this.controller
            .update(id, subjectForm)
            .then(newSubject => {
                ctx.status = status.OK;
                ctx.body = newSubject;
            })
            .catch(handleControllerError(ctx));
    };
}

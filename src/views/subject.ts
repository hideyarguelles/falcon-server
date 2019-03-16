import * as status from "http-status-codes";
import { Context } from "koa";
import SubjectController from "../controllers/subject";
import SubjectForm from "../entities/subject";
import { UserType } from "../enums";
import View from "../interfaces/view";
import { RequireAuthorization } from "../utils/require_authorization";

export default class SubjectView extends View<SubjectController> {
    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk, UserType.Faculty])
    getAll = async (ctx: Context): Promise<void> => {
        await this.controller.getAll().then(subjects => {
            ctx.status = status.OK;
            ctx.body = subjects;
        });
    };

    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk, UserType.Faculty])
    get = async (ctx: Context): Promise<void> => {
        const { subjectId } = ctx.params;
        await this.controller.get(subjectId).then(subject => {
            ctx.status = status.OK;
            ctx.body = subject;
        });
    };

    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk, UserType.Faculty])
    getCourses = async (ctx: Context): Promise<void> => {
        await this.controller.getCourses().then(c => {
            ctx.status = status.OK;
            ctx.body = c;
        });
    }

    @RequireAuthorization([UserType.Clerk])
    add = async (ctx: Context): Promise<void> => {
        const subjectForm: SubjectForm = ctx.request.body;
        await this.controller.add(subjectForm).then(newSubject => {
            ctx.status = status.CREATED;
            ctx.body = newSubject;
        });
    };

    @RequireAuthorization([UserType.Clerk])
    update = async (ctx: Context): Promise<void> => {
        const { subjectId } = ctx.params;
        const subjectForm: SubjectForm = ctx.request.body;
        await this.controller.update(subjectId, subjectForm).then(newSubject => {
            ctx.status = status.OK;
            ctx.body = newSubject;
        });
    };
}

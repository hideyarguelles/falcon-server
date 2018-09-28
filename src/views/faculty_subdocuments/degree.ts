import * as status from "http-status-codes";
import { Context } from "koa";
import { DegreeController } from "../../controllers/faculty_subdocuments";
import { UserType } from "../../enums";
import View from "../../interfaces/view";
import { RequireAuthorization } from "../../utils/require_authorization";

export class DegreeView extends View<DegreeController> {
    @RequireAuthorization([UserType.Clerk])
    add = async (ctx: Context): Promise<void> => {
        const form = ctx.request.body;
        await this.controller.add(form).then(degree => {
            ctx.status = status.CREATED;
            ctx.body = degree;
        });
    };

    @RequireAuthorization([UserType.Clerk])
    update = async (ctx: Context): Promise<void> => {
        const form = ctx.request.body;
        const { degreeId } = ctx.params;
        await this.controller.update(degreeId, form).then(degree => {
            ctx.status = status.CREATED;
            ctx.body = degree;
        });
    };

    @RequireAuthorization([UserType.Clerk])
    remove = async (ctx: Context): Promise<void> => {
        const { degreeId } = ctx.params;
        await this.controller.remove(degreeId).then(() => {
            ctx.status = status.NO_CONTENT;
        });
    };
}

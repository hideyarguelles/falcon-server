import * as status from "http-status-codes";
import { Context } from "koa";
import { FacultyController } from "../controller";
import { UserType } from "../enum";
import { handleControllerError } from "../utils/handle_controller_error";
import { requireAuthorization } from "../utils/require_authorization";

export default class FacultyView {
    @requireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk])
    static async getAll(ctx: Context): Promise<void> {
        await FacultyController.getAll()
            .then(facultyMembers => {
                ctx.status = status.OK;
                ctx.body = facultyMembers;
            })
            .catch(handleControllerError(ctx));
    }

    @requireAuthorization([UserType.Clerk])
    static async add(ctx: Context): Promise<void> {
        const { user: userForm, faculty: facultyMemberForm } = ctx.request.body;
        await FacultyController.add(userForm, facultyMemberForm)
            .then(data => {
                ctx.status = status.CREATED;
                ctx.body = data;
            })
            .catch(handleControllerError(ctx));
    }

    @requireAuthorization([])
    static async update(ctx: Context): Promise<void> {}
}

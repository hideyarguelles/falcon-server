import * as status from "http-status-codes";
import * as Boom from "boom";
import { Context } from "koa";
import { FacultyController } from "../controller";
import { UserType } from "../enum";
import { handleControllerError } from "../utils/handle_controller_error";
import { requireAuthorization } from "../utils/require_authorization";
import { setContextBoom } from "../utils/set_context_boom";

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
            .then(facultyMember => {
                delete facultyMember.user.secret;

                ctx.status = status.CREATED;
                ctx.body = facultyMember;
            })
            .catch(handleControllerError(ctx));
    }

    @requireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk])
    static async update(ctx: Context): Promise<void> {
        const { id } = ctx.params;
        const { user: userForm, faculty: facultyMemberForm } = ctx.request.body;
        await FacultyController.update(id, userForm, facultyMemberForm)
            .then(data => {
                if (!data) {
                    setContextBoom(ctx, Boom.notFound(`Could not find faculty of id ${id}`));
                } else {
                    ctx.status = status.OK;
                    ctx.body = data;
                }
            })
            .catch(handleControllerError(ctx));
    }
}

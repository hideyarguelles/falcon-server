import * as Boom from "boom";
import * as status from "http-status-codes";
import { Context } from "koa";
import { FacultyMemberController } from "../controllers";
import { UserType } from "../enum";
import View from "../interfaces/view";
import { handleControllerError } from "../utils/handle_controller_error";
import { RequireAuthorization } from "../utils/require_authorization";
import { setContextBoom } from "../utils/set_context_boom";
import { DegreeView } from "./faculty_subdocuments";

export default class FacultyMemberView extends View<FacultyMemberController> {
    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk])
    getAll = async (ctx: Context): Promise<void> => {
        await this.controller
            .getAll()
            .then(facultyMembers => {
                ctx.status = status.OK;
                ctx.body = facultyMembers;
            })
            .catch(handleControllerError(ctx));
    };

    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk])
    get = async (ctx: Context): Promise<void> => {
        const { id } = ctx.params;
        await this.controller
            .get(id)
            .then(facultyMember => {
                ctx.status = status.OK;
                ctx.body = facultyMember;
            })
            .catch(handleControllerError(ctx));
    };

    @RequireAuthorization([UserType.Clerk])
    add = async (ctx: Context): Promise<void> => {
        const { user: userForm, faculty: facultyMemberForm } = ctx.request.body;
        await this.controller
            .add(userForm, facultyMemberForm)
            .then(facultyMember => {
                delete facultyMember.user.secret;

                ctx.status = status.CREATED;
                ctx.body = facultyMember;
            })
            .catch(handleControllerError(ctx));
    };

    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk])
    update = async (ctx: Context): Promise<void> => {
        const { id } = ctx.params;
        const { user: userForm, faculty: facultyMemberForm } = ctx.request.body;
        await this.controller
            .update(id, userForm, facultyMemberForm)
            .then(data => {
                if (!data) {
                    setContextBoom(ctx, Boom.notFound(`Could not find faculty of id ${id}`));
                } else {
                    ctx.status = status.OK;
                    ctx.body = data;
                }
            })
            .catch(handleControllerError(ctx));
    };

    getDegreeView = async (ctx: Context): Promise<DegreeView> => {
        const { id } = ctx.params;
        const controller = await this.controller.getDegreeController(id);
        return new DegreeView(controller);
    };
}

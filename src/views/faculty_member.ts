import * as Boom from "boom";
import * as status from "http-status-codes";
import { Context } from "koa";
import FacultyMemberController from "../controllers/faculty_member";
import { FacultyMemberForm } from "../entities/forms/faculty_member";
import { UserForm } from "../entities/forms/user";
import { UserType } from "../enums";
import View from "../interfaces/view";
import { RequireAuthorization } from "../utils/require_authorization";
import { setContextBoom } from "../utils/set_context_boom";

export default class FacultyMemberView extends View<FacultyMemberController> {
    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk])
    getAll = async (ctx: Context): Promise<void> => {
        await this.controller.getAll().then(facultyMembers => {
            ctx.status = status.OK;
            ctx.body = facultyMembers;
        });
    };

    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk])
    get = async (ctx: Context): Promise<void> => {
        const { facultyId } = ctx.params;
        await this.controller.get(facultyId).then(facultyMember => {
            ctx.status = status.OK;
            ctx.body = facultyMember;
        });
    };

    @RequireAuthorization([UserType.Clerk])
    add = async (ctx: Context): Promise<void> => {
        const form = ctx.request.body;

        const userForm: UserForm = {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
        };

        const facultyMemberForm: FacultyMemberForm = {
            sex: form.sex,
            type: form.type,
            activity: form.activity,
            birthDate: form.birthDate,
            pnuId: form.pnuId,
        };

        await this.controller.add(userForm, facultyMemberForm).then(facultyMember => {
            delete facultyMember.user.secret;

            ctx.status = status.CREATED;
            ctx.body = facultyMember;
        });
    };

    @RequireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk])
    update = async (ctx: Context): Promise<void> => {
        const { facultyId } = ctx.params;
        const { user: userForm, faculty: facultyMemberForm } = ctx.request.body;
        await this.controller.update(facultyId, userForm, facultyMemberForm).then(data => {
            if (!data) {
                setContextBoom(ctx, Boom.notFound(`Could not find faculty of id ${facultyId}`));
            } else {
                ctx.status = status.OK;
                ctx.body = data;
            }
        });
    };
}

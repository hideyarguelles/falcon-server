import * as status from "http-status-codes";
import { Context } from "koa";
import { FacultyMember } from "../entity";
import { UserType } from "../enum";
import { requireAuthorization } from "../utils/require_authorization";

export default class FacultyController {
    @requireAuthorization([UserType.Dean, UserType.AssociateDean, UserType.Clerk])
    static async getAllFaculty(ctx: Context): Promise<void> {
        const facultyMembers = await FacultyMember.find();
        ctx.status = status.OK;
        ctx.body = facultyMembers;
    }

    @requireAuthorization([])
    static async addFacultyMember(ctx: Context): Promise<void> {}

    @requireAuthorization([])
    static async updateFacultyMember(ctx: Context): Promise<void> {}
}

import { Context } from "koa";
import { FacultyMember } from "../entity";

export const getAllFaculty = async (ctx: Context): Promise<void> => {
    // TODO: Remove experiment

    const select = ctx.request.query.select;
    const facultyMembers = await FacultyMember.find();

    ctx.status = 200;
    ctx.body = {
        facultyMembers,
        select,
        success: true,
    };
};

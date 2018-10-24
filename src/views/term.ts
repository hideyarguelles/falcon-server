import View from "../interfaces/view";
import TermController from "../controllers/term";
import { Context } from "koa";
import * as status from "http-status-codes";

export default class TermView extends View<TermController> {
    getAll = async (ctx: Context): Promise<void> => {
        await this.controller.getAll().then(t => {
            ctx.status = status.OK;
            ctx.body = t;
        });
    };

    get = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        await this.controller.get(termId).then(t => {
            ctx.status = status.OK;
            ctx.body = t;
        });
    };

    add = async (ctx: Context): Promise<void> => {
        const form = ctx.request.body;
        await this.controller.add(form).then(t => {
            ctx.status = status.CREATED;
            ctx.body = t;
        });
    };

    addClassSchedule = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        const form = ctx.request.body;
        await this.controller.addClassSchedule(termId, form).then(cs => {
            ctx.status = status.CREATED;
            ctx.body = cs;
        });
    };

    getFacultyMembers = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        await this.controller.getFacultyMembers(termId).then(fm => {
            ctx.status = status.OK;
            ctx.body = fm;
        });
    };

    getClassSchedules = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        await this.controller.getClassSchedules(termId).then(cs => {
            ctx.status = status.OK;
            ctx.body = cs;
        });
    };

    getMySchedule = async (ctx: Context): Promise<void> => {
        const { termId } = ctx.params;
        const { user } = ctx.state;
        await this.controller.getMySchedule(termId, user).then(ms => {
            ctx.status = status.OK;
            ctx.body = ms;
        });
    };
}

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
}

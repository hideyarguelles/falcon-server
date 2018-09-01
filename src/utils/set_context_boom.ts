import * as Boom from "boom";
import { Context } from "koa";

export const setContextBoom = (ctx: Context, boom: Boom) => {
    const output = boom.output;
    ctx.status = output.statusCode;
    ctx.body = output.payload;
};

import * as Boom from "boom";
import * as status from "http-status-codes";
import { Context, Middleware } from "koa";
import { setContextBoom } from "../utils/set_context_boom";

export const boomifyExceptions = (): Middleware => async (
    ctx: Context,
    next: () => Promise<any>,
) => {
    return next().catch(error => {
        setContextBoom(ctx, Boom.boomify(error, { statusCode: status.BAD_REQUEST }));
    });
};

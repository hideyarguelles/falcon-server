import * as status from "http-status-codes";
import { Context } from "koa";
import * as Router from "koa-router";
import { boomifyExceptions } from "../middleware/boomify_exceptions";
import { nestRouter } from "../utils/nest_router";
import facultyMemberRouter from "./faculty_member";
import userRouter from "./user";

// Always return OK at /
const rootRouter = new Router();
rootRouter.all("/", async (ctx: Context) => {
    ctx.status = status.OK;
});

const apiRouter = new Router()
    // All API routes must begin with /api
    .prefix("/api")
    // All uncaught API exceptions will be formatted nicely in the response
    .use(boomifyExceptions());

nestRouter(apiRouter, [userRouter, facultyMemberRouter]);
nestRouter(rootRouter, apiRouter);
export default rootRouter;

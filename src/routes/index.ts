import * as status from "http-status-codes";
import { Context } from "koa";
import * as Router from "koa-router";
import { catchResponseError } from "../middleware/catch_response_error";
import { nestRouter } from "../utils/nest_router";
import facultyMemberRouter from "./faculty_member";
import subdocumentRouter from "./faculty_subdocuments";
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
    .use(catchResponseError());

nestRouter(apiRouter, [userRouter, facultyMemberRouter, subdocumentRouter]);
nestRouter(rootRouter, apiRouter);
export default rootRouter;

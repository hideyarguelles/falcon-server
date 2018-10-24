import * as status from "http-status-codes";
import { Context } from "koa";
import * as Router from "koa-router";
import { catchResponseError } from "../middlewares/catch_response_error";
import { nestRouter } from "../utils/nest_router";
import classScheduleRouter from "./class_schedule";
import facultyMemberRouter from "./faculty_member";
import subdocumentRouter from "./faculty_subdocuments";
import subjectRouter from "./subject";
import termRouter from "./term";
import userRouter from "./user";

const API_CHILD_ROUTERS = [
    // List all routes under /api here
    userRouter,
    facultyMemberRouter,
    subdocumentRouter,
    subjectRouter,
    termRouter,
    classScheduleRouter,
];

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

nestRouter(apiRouter, API_CHILD_ROUTERS);
nestRouter(rootRouter, apiRouter);
export default rootRouter;

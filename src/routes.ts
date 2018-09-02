import * as Router from "koa-router";
import { UserView, FacultyView } from "./view";
import { nestRouter } from "./utils/nest_router";
import { boomifyExceptions } from "./middleware/boomify_exceptions";

const apiRouter = new Router()
    // All API routes must begin with /api
    .prefix("/api")
    // All uncaught API exceptions will be formatted nicely in the response
    .use(boomifyExceptions());

//
// ─── User routes ──────────────────────────────────────────────────────────────────────────
//

const userRouter = new Router()
    .post("/sign-in", UserView.signIn)
    .post("/sign-out", UserView.signOut)
    .post("/set-password", UserView.setPassword)
    .get("/current-user", UserView.currentUser);

//
// ─── Faculty Routes ─────────────────────────────────────────────────────────────
//

const facultyRouter = new Router();
facultyRouter
    .prefix("/faculty")
    .get("/", FacultyView.getAll)
    .post("/", FacultyView.add);

//
// ─── Nesting ───────────────────────────────────────────────────────────────────────────
//

nestRouter(apiRouter, [userRouter, facultyRouter]);
export { apiRouter };

import * as Router from "koa-router";
import { UserView, FacultyMemberView } from "./view";
import { nestRouter } from "./utils/nest_router";
import { boomifyExceptions } from "./middleware/boomify_exceptions";
import { FacultyMemberController, UserController } from "./controller";

const apiRouter = new Router()
    // All API routes must begin with /api
    .prefix("/api")
    // All uncaught API exceptions will be formatted nicely in the response
    .use(boomifyExceptions());

//
// ─── User routes ──────────────────────────────────────────────────────────────────────────
//

const userView = new UserView(new UserController());
const userRouter = new Router()
    .post("/sign-in", userView.signIn)
    .post("/sign-out", userView.signOut)
    .post("/set-password", userView.setPassword)
    .get("/current-user", userView.currentUser);

//
// ─── Faculty Routes ─────────────────────────────────────────────────────────────
//

const facultyRouter = new Router();
const facultyMemberView = new FacultyMemberView(new FacultyMemberController());

facultyRouter
    .prefix("/faculty")
    .get("/", facultyMemberView.getAll)
    .post("/", facultyMemberView.add)
    .get("/:id", facultyMemberView.get)
    .put("/:id", facultyMemberView.update);

//
// ─── Nesting ───────────────────────────────────────────────────────────────────────────
//

nestRouter(apiRouter, [userRouter, facultyRouter]);
export { apiRouter };

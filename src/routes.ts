import * as Router from "koa-router";
import { UserController, FacultyController } from "./controller";
import { UserType } from "./enum";
import { nestRouter } from "./utils/nest_router";

const apiRouter = new Router();
apiRouter.prefix("/api");

//
// ─── User routes ──────────────────────────────────────────────────────────────────────────
//

const userRouter = new Router()
    .post("/sign-in", UserController.signIn)
    .post("/sign-out", UserController.signOut)
    .post("/set-password", UserController.setPassword)
    .get("/current-user", UserController.currentUser);

//
// ─── Faculty Routes ─────────────────────────────────────────────────────────────
//

const facultyRouter = new Router();
facultyRouter
    .prefix("/faculty")
    .get("/", FacultyController.getAllFaculty)
    .post("/", FacultyController.addFacultyMember);

//
// ─── Nesting ───────────────────────────────────────────────────────────────────────────
//

nestRouter(apiRouter, [userRouter, facultyRouter]);
export { apiRouter };

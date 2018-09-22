import * as Router from "koa-router";
import { UserController } from "../controllers";
import { UserView } from "../views";

const userView = new UserView(new UserController());
export default new Router()
    .post("/sign-in", userView.signIn)
    .post("/sign-out", userView.signOut)
    .post("/set-password", userView.setPassword)
    .get("/current-user", userView.currentUser);

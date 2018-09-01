import * as Router from "koa-router";
import * as controller from "./controller";

const router = new Router();
router.prefix("/api");

// User routes
const userRouter = new Router();
userRouter.post("/sign-in", controller.user.signIn);
userRouter.post("/sign-out", controller.user.signOut);
userRouter.post("/set-password", controller.user.setPassword);
userRouter.get("/current-user", controller.user.currentUser);

const nest = (nestedRouter: Router): void => {
    router.use(nestedRouter.routes()).use(nestedRouter.allowedMethods());
};

nest(userRouter);

export { router };

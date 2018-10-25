import * as status from "http-status-codes";
import * as jwt from "jsonwebtoken";
import { Context } from "koa";
import { config } from "../config";
import UserController from "../controllers/user";
import View from "../interfaces/view";

export default class UserView extends View<UserController> {
    signIn = async (ctx: Context): Promise<void> => {
        const { email, password } = ctx.request.body;
        await this.controller.signIn(email, password).then(user => {
            delete user.secret;

            const token = jwt.sign({ id: user.id }, config.jwtSecret);
            ctx.cookies.set("token", token, { httpOnly: true });
            ctx.status = status.OK;
            ctx.body = user;
        });
    };

    signOut = async (ctx: Context): Promise<void> => {
        ctx.status = status.OK;
        ctx.cookies.set("token");
        ctx.body = {
            message: "Sign out success",
        };
    };

    currentUser = async (ctx: Context): Promise<void> => {
        const { user } = ctx.state;
        ctx.status = status.OK;
        ctx.body = user;
    };

    setPassword = async (ctx: Context): Promise<void> => {
        const { user } = ctx.state;
        const form = ctx.request.body;
        await this.controller.setPassword(user, form).then(() => {
            ctx.status = status.OK;
        });
    };
}

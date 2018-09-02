import * as status from "http-status-codes";
import * as jwt from "jsonwebtoken";
import { Context } from "koa";
import { config } from "../config";
import { UserController } from "../controller";
import { handleControllerError } from "../utils/handle_controller_error";

export default class UserView {
    static async signIn(ctx: Context): Promise<void> {
        const { email, password } = ctx.request.body;
        await UserController.signIn(email, password)
            .then(user => {
                const token = jwt.sign({ id: user.id }, config.jwtSecret);
                ctx.cookies.set("token", token, { httpOnly: true });
                ctx.status = status.OK;
                ctx.body = {
                    name: {
                        first: user.firstName,
                        last: user.lastName,
                    },
                    email: user.email,
                    authorization: user.authorization,
                    passwordIsTemporary: user.passwordIsTemporary,
                };
            })
            .catch(handleControllerError(ctx));
    }

    static async signOut(ctx: Context): Promise<void> {
        ctx.status = status.OK;
        ctx.cookies.set("token");
        ctx.body = {
            message: "Sign out success",
        };
    }

    static async currentUser(ctx: Context): Promise<void> {
        const { user } = ctx.state;
        ctx.status = status.OK;
        ctx.body = {
            name: {
                first: user.firstName,
                last: user.lastName,
            },
            email: user.email,
            authorization: user.authorization,
            passwordIsTemporary: user.passwordIsTemporary,
        };
    }

    static async setPassword(ctx: Context): Promise<void> {}
}

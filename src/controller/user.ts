import * as Boom from "boom";
import * as status from "http-status-codes";
import * as jwt from "jsonwebtoken";
import { Context } from "koa";
import { config } from "../config";
import { User } from "../entity";
import { setContextBoom } from "../utils/set_context_boom";

export const signIn = async (ctx: Context): Promise<void> => {
    const { email, password } = ctx.request.body;

    if (!email || !password) {
        setContextBoom(ctx, Boom.badRequest("email and password is required"));
        return;
    }

    const user = await User.findByEmail(email);
    const isValidPassword = user && (await user.comparePassword(password));

    if (!user || !isValidPassword) {
        setContextBoom(ctx, Boom.badRequest("Invalid credentials"));
        return;
    }

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
};

export const signOut = async (ctx: Context): Promise<void> => {
    ctx.status = status.OK;
    ctx.cookies.set("token");
    ctx.body = {
        message: "Sign out success",
    };
};

export const currentUser = async (ctx: Context): Promise<void> => {
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
};

export const setPassword = async (ctx: Context): Promise<void> => {};

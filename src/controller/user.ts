import { BaseContext } from "koa";
import * as Boom from "boom";
import * as jwt from "jsonwebtoken";
import { User } from "../entity/user";
import * as status from "http-status-codes";
import { config } from "../config";

export const signIn = async (ctx: BaseContext): Promise<void> => {
    const { email, password } = ctx.request.body;

    if (!email || !password) {
        const boom = Boom.badRequest("email and password is required").output;
        ctx.status = boom.statusCode;
        ctx.body = boom.payload;
        return;
    }

    const user = await User.findByEmail(email);
    const isValidPassword = user && (await user.comparePassword(password));

    if (!user || !isValidPassword) {
        const boom = Boom.badRequest("Invalid credentials").output;
        ctx.status = boom.statusCode;
        ctx.body = boom.payload;
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

export const signOut = async (ctx: BaseContext): Promise<void> => {
    ctx.status = status.OK;
    ctx.cookies.set("token");
    ctx.body = {
        message: "Sign out success",
    };
};

export const currentUser = async (ctx: BaseContext): Promise<void> => {
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

export const setPassword = async (ctx: BaseContext): Promise<void> => {};

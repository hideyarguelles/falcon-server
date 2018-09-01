import * as Boom from "boom";
import * as jwt from "jsonwebtoken";
import * as Koa from "koa";
import * as unless from "koa-unless";
import { User } from "../entity";

interface AppToken {
    id: string;
}

interface Middleware extends Koa.Middleware {
    unless?(params?: any): any;
}

export const includeCurrentUser = (): Middleware => {
    const middleware: Middleware = async (ctx: Koa.Context, next: () => Promise<any>) => {
        // Cannot fail because of koa-jwt middleware
        const token = ctx.cookies.get("token");
        const { id } = <AppToken>jwt.decode(token);

        if (!id) {
            const boom = Boom.badRequest("ID not found in JWT").output;
            ctx.status = boom.statusCode;
            ctx.body = boom.payload;
            ctx.cookies.set("token"); // Remove invalid token
            return;
        }

        const user = await User.findOne({ where: { id } });
        if (!user) {
            const boom = Boom.badRequest("User not found").output;
            ctx.status = boom.statusCode;
            ctx.body = boom.payload;
            ctx.cookies.set("token"); // Remove invalid token
            return;
        }

        ctx.state.user = user;
        return next();
    };

    middleware.unless = unless;
    return middleware;
};

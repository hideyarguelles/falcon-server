import * as Boom from "boom";
import * as jwt from "jsonwebtoken";
import * as Koa from "koa";
import * as unless from "koa-unless";
import { User } from "../entity";
import { setContextBoom } from "../utils/set_context_boom";

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
            setContextBoom(ctx, Boom.badRequest("ID not found in JWT"));
            ctx.cookies.set("token"); // Remove invalid token
            return;
        }

        const user = await User.findOne({ where: { id } });
        if (!user) {
            setContextBoom(ctx, Boom.badRequest("User not found"));
            ctx.cookies.set("token"); // Remove invalid token
            return;
        }

        ctx.state.user = user;
        return next();
    };

    middleware.unless = unless;
    return middleware;
};

import { User } from "../entity";
import { UserType } from "../enum";
import * as Koa from "koa";
import * as status from "http-status-codes";

export const requireAuthorization = (allowed: UserType[]): Koa.Middleware => async (
    ctx: Koa.Context,
    next: () => Promise<any>,
) => {
    const user: User = ctx.state.user;

    const isGuestAndAllowed = !user && allowed.includes(UserType.Guest);
    const isAuthenticatedAndAuthorized = user && allowed.includes(user.authorization);

    if (isGuestAndAllowed || isAuthenticatedAndAuthorized) {
        return next();
    }

    ctx.status = status.FORBIDDEN;
    ctx.body = {
        message: "User is not authorized to perform this action",
    };
};

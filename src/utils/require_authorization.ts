import { User } from "../entity";
import { UserType } from "../enum";
import { Context } from "koa";
import * as status from "http-status-codes";

type ViewNext = () => Promise<any>;
type ViewFunction = (Context, ViewNext?) => any;

export const requireAuthorization = (allowed: UserType[]) => (
    target: any,
    propertyKey: string,
    descriptor?: TypedPropertyDescriptor<ViewFunction>,
) => {
    if (!descriptor) {
        return;
    }

    const route = descriptor.value;
    descriptor.value = async (ctx: Context, next?: ViewNext) => {
        const user: User = ctx.state.user;

        const isGuestAndAllowed = !user && allowed.includes(UserType.Guest);
        const isAuthenticatedAndAuthorized = user && allowed.includes(user.authorization);

        if (isGuestAndAllowed || isAuthenticatedAndAuthorized) {
            return route(ctx, next);
        }

        ctx.status = status.FORBIDDEN;
        ctx.body = {
            message: "User is not authorized to perform this action",
        };
    };
};

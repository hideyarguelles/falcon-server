import { BaseContext } from "koa";

export const helloWorld = async (ctx: BaseContext): Promise<void> => {
    ctx.body = "Hello, World!";
};

export const getJwtPayload = async (ctx: BaseContext): Promise<void> => {
    // example just to set a different status
    ctx.status = 201;
    // the body of the response will contain the information contained as payload in the JWT
    ctx.body = ctx.state.user;
};

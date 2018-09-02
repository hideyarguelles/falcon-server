import { ValidationError } from "class-validator";
import { Context } from "koa";
import * as Boom from "boom";
import { setContextBoom } from "./set_context_boom";

export const setContextValidationErrors = (ctx: Context, errors: ValidationError[]) => {
    setContextBoom(ctx, Boom.badRequest("Validation failed"));

    const validationErrors = errors
        .map(error => Object.values(error.constraints))
        .reduce((prev, curr) => prev.concat(curr));

    ctx.body.validationErrors = validationErrors;
};

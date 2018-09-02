import * as Boom from "boom";
import * as status from "http-status-codes";
import { ValidationError } from "class-validator";
import { Context } from "koa";
import { setContextBoom } from "./set_context_boom";
import { setContextValidationErrors } from "./set_context_validation_error";

export const handleControllerError = (ctx: Context) => (error: Error | ValidationError[]) => {
    if (Array.isArray(error)) {
        setContextValidationErrors(ctx, error);
    } else {
        setContextBoom(ctx, Boom.boomify(error, { statusCode: status.BAD_REQUEST }));
    }
};

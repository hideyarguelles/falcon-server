import * as Boom from "boom";
import * as status from "http-status-codes";
import { Context } from "koa";
import { setContextBoom } from "./set_context_boom";
import { setContextValidationErrors } from "./set_context_validation_error";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";

type ErrorType = Error | ValidationFailError | EntityNotFoundError;

export const handleControllerError = (ctx: Context) => (error: ErrorType) => {
    switch (error.constructor) {
        case EntityNotFoundError:
            setContextBoom(ctx, Boom.notFound(error.message));
            return;
        case ValidationFailError:
            const errors = (error as ValidationFailError).errors;
            setContextValidationErrors(ctx, errors);
            return;
        default:
            setContextBoom(ctx, Boom.boomify(error, { statusCode: status.BAD_REQUEST }));
    }
};

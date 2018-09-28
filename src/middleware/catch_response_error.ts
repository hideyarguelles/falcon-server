import * as Boom from "boom";
import * as status from "http-status-codes";
import { Context, Middleware } from "koa";
import EntityNotFoundError from "../errors/not_found";
import ValidationFailError from "../errors/validation_fail_error";
import { setContextBoom } from "../utils/set_context_boom";
import { setContextValidationErrors } from "../utils/set_context_validation_error";

type ErrorType = Error | ValidationFailError | EntityNotFoundError;

export const catchResponseError = (): Middleware => async (
    ctx: Context,
    next: () => Promise<any>,
) => {
    return next().catch((error: ErrorType) => {
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
    });
};

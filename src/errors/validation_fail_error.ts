import { ValidationError } from "class-validator";

export default class ValidationFailError extends Error {
    errors: ValidationError[];

    constructor(errors: ValidationError[]) {
        super(`${errors.length} occured during validation`);
        this.errors = errors;
    }
}

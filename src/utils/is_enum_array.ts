import { ValidationOptions, registerDecorator, ValidationArguments } from "class-validator";

const validate = (value: any, args: ValidationArguments): boolean => {
    const [enumeration] = args.constraints;
    const enumerationValues = Object.values(enumeration);

    // Check if individual item is member of enum
    const isEnum = (item: string) => enumerationValues.includes(item);

    // Check if all values are enums
    return value.every(isEnum);
};

const IsEnumArray = (enumeration: Object, validationOptions?: ValidationOptions) => (
    object: Object,
    propertyName: string,
) => {
    registerDecorator({
        name: "isEnumArray",
        target: object.constructor,
        propertyName: propertyName,
        constraints: [enumeration],
        options: validationOptions,
        validator: { validate },
    });
};

export default IsEnumArray;

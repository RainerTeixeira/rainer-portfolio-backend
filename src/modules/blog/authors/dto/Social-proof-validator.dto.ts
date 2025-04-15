import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validador customizado para links sociais no formato DynamoDB
 */
export function IsSocialProof(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isSocialProof',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown) {
                    if (typeof value !== 'object' || value === null) return false;

                    return Object.entries(value).every(([key, entry]) =>
                        typeof key === 'string' &&
                        typeof entry === 'object' &&
                        entry !== null &&
                        'S' in entry &&
                        typeof entry.S === 'string'
                    );
                },
                defaultMessage(args: ValidationArguments) {
                    return `${args.property} deve ser um objeto no formato { rede: { S: "url" } }`;
                },
            },
        });
    };
}
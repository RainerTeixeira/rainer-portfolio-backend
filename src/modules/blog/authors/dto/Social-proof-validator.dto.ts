import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsSocialProof(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'isSocialProof',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    if (value === null || value === undefined) return true; // Se for opcional
                    if (typeof value !== 'object' || Array.isArray(value)) return false;

                    // Verifica se cada valor do objeto está no formato correto
                    for (const key in value) {
                        const entry = value[key];
                        if (
                            typeof key !== 'string' ||
                            typeof entry !== 'object' ||
                            !entry.S ||
                            typeof entry.S !== 'string'
                        ) {
                            return false;
                        }
                    }
                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    return 'socialProof deve ser um objeto no formato { M: { chave: { S: "valor" } } }';
                },
            },
        });
    };
}

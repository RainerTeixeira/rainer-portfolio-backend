// src/modules/blog/authors/dto/Social-proof-validator.dto.ts
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
                    // Para cada chave, verifique se o valor é string
                    for (const key in value) {
                        if (typeof key !== 'string' || typeof value[key] !== 'string') {
                            return false;
                        }
                    }
                    return true;
                },
                defaultMessage(args: ValidationArguments) {
                    return 'socialProof deve ser um objeto com chaves e valores do tipo string';
                },
            },
        });
    };
}

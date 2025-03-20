import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

interface SocialProofEntry {
    S?: string;
}

interface SocialProofObject {
    [key: string]: SocialProofEntry;
}

/**
 * Decorator personalizado para validar o campo socialProof.
 *
 * @param validationOptions Opções de validação.
 * @returns Função de validação.
 */
export function IsSocialProof(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isSocialProof',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown, _args: ValidationArguments) {
                    void _args; // Sinaliza que o parâmetro foi intencionalmente ignorado.
                    if (value === null || value === undefined) return true; // Se for opcional
                    if (typeof value !== 'object' || Array.isArray(value)) return false;

                    const socialProof = value as SocialProofObject;

                    // Verifica se cada valor do objeto está no formato correto
                    for (const key in socialProof) {
                        const entry = socialProof[key];
                        if (
                            typeof key !== 'string' ||
                            typeof entry !== 'object' ||
                            !entry ||
                            typeof entry.S !== 'string'
                        ) {
                            return false;
                        }
                    }
                    return true;
                },
                defaultMessage(_args: ValidationArguments) {
                    void _args; // Sinaliza que o parâmetro foi intencionalmente ignorado.
                    return 'socialProof deve ser um objeto no formato { chave: { S: "valor" } }';
                },
            },
        });
    };
}

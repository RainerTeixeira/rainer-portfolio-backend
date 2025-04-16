import { IsNotEmpty } from 'class-validator'; // Importação do decorador
import { PartialType } from '@nestjs/mapped-types';
import { BaseAuthorDto } from './base-author.dto';

/**
 * DTO para atualização de autores com campos opcionais
 */
export class UpdateAuthorDto extends PartialType(BaseAuthorDto) {
    @IsNotEmpty() // Decorador de validação
    updated_at!: string;
}

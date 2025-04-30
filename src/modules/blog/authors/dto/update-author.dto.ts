import { IsNotEmpty } from 'class-validator'; // Importação do decorador
import { PartialType } from '@nestjs/mapped-types';
import { BaseAuthorDto } from './base-author.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para atualização de autores com campos opcionais
 */
export class UpdateAuthorDto extends PartialType(BaseAuthorDto) {
    @ApiProperty({ description: 'Data da última atualização' })
    @IsNotEmpty() // Decorador de validação
    updated_at!: string;
}

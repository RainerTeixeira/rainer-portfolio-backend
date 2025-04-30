import { IsNotEmpty } from 'class-validator';
import { BaseAuthorDto } from './base-author.dto';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para criação de autores com validação estendida
 */
export class CreateAuthorDto extends BaseAuthorDto {
    @ApiProperty({ description: 'ID único do autor' })
    @IsNotEmpty()
    id!: string;

    @ApiProperty({ description: 'Data de criação do registro' })
    @IsNotEmpty()
    created_at!: string;
}
import { IsNotEmpty } from 'class-validator';
import { BaseAuthorDto } from './base-author.dto';

/**
 * DTO para criação de autores com validação estendida
 */
export class CreateAuthorDto extends BaseAuthorDto {
    @IsNotEmpty()
    id!: string;

    @IsNotEmpty()
    created_at!: string;
}
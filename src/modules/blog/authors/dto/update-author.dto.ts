import { PartialType } from '@nestjs/mapped-types';
import { BaseAuthorDto } from './base-author.dto';

/**
 * DTO para atualização de autores com campos opcionais
 */
export class UpdateAuthorDto extends PartialType(BaseAuthorDto) {
    @IsNotEmpty()
    updated_at!: string;
}
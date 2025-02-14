// src/modules/blog/posts/dto/update-post.dto.ts
import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PostInfoDto } from './post-info.dto';
import { PostSeoDto } from './post-seo.dto';

/**
 * DTO para atualizar um Post existente.
 * Todas as propriedades são opcionais, pois apenas os campos que precisam ser atualizados serão enviados.
 */
export class UpdatePostDto {
    @IsOptional()
    @IsString()
    categoryId?: string; // Opcional para atualização

    @IsOptional()
    @IsString()
    subcategoryId?: string; // Opcional para atualização

    @IsOptional()
    @IsString()
    contentHTML?: string; // Opcional para atualização

    @IsOptional()
    @ValidateNested()
    @Type(() => PostInfoDto)
    postInfo?: PostInfoDto; // Opcional para atualização

    @IsOptional()
    @ValidateNested()
    @Type(() => PostSeoDto)
    seo?: PostSeoDto; // Opcional para atualização
}
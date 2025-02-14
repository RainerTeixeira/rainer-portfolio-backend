// src/modules/blog/posts/dto/post-seo.dto.ts
import { IsString, IsOptional, IsArray } from 'class-validator';

/**
 * DTO para o objeto aninhado 'seo' dentro do PostDto.
 * Define as propriedades relacionadas a SEO para um post.
 */
export class PostSeoDto {
    @IsOptional()
    @IsString()
    canonical?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];
}
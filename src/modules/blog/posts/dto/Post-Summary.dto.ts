// src/modules/blog/posts/dto/Post-summary.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

export class PostSummaryDto {
    @IsString()
    @IsNotEmpty()
    postId: string;

    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @IsString()
    @IsNotEmpty()
    subcategoryId: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    featuredImageURL?: string;

    @IsOptional() // Tags podem ser opcionais no resumo, dependendo do uso
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    publishDate?: string; // Adicionando publishDate, pode ser útil no resumo também
}
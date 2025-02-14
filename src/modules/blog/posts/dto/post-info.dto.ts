// src/modules/blog/posts/dto/post-info.dto.ts
import { IsString, IsOptional, IsArray, IsNumber, IsNotEmpty } from 'class-validator';

/**
 * DTO para o objeto aninhado 'postInfo' dentro do PostDto.
 * Contém informações adicionais sobre o post, como autor, tags, trecho, etc.
 */
export class PostInfoDto {
    @IsOptional()
    @IsString()
    authorId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    excerpt?: string;

    @IsOptional()
    @IsString()
    featuredImageURL?: string;

    @IsOptional()
    @IsString()
    modifiedDate?: string;

    @IsString()
    @IsNotEmpty() // Garante que publishDate não seja vazio
    publishDate: string;

    @IsOptional()
    @IsNumber()
    readingTime?: number;

    @IsString()
    @IsNotEmpty() // Garante que slug não seja vazio
    slug: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsString()
    @IsNotEmpty() // Garante que title não seja vazio
    title: string;

    @IsOptional()
    @IsNumber()
    views?: number;
}
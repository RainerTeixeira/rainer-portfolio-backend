// src/modules/blog/posts/dto/Update-post.dto.ts
import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    subcategoryId?: string;

    @IsOptional()
    @IsString()
    contentHTML?: string;

    @IsOptional()
    @IsString()
    authorId?: string;

    @IsOptional()
    @IsString()
    publishDate?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    featuredImageURL?: string;

    @IsOptional()
    @IsNumber()
    readingTime?: number;

    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsNumber()
    views?: number;

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
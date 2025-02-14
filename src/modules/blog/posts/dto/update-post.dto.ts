// src/modules/blog/posts/dto/update-post.dto.ts

import { PostDto } from '@src/modules/blog/posts/dto/post.dto'; // Import PostDto usando alias @src.
import { IsOptional, IsString, IsNumber, IsObject, IsArray } from 'class-validator'; // Import decorators de validação

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
    @IsObject()
    postInfo?: {
        authorId?: string;
        excerpt?: string;
        featuredImageURL?: string;
        modifiedDate?: string;
        publishDate?: string;
        readingTime?: number;
        slug?: string;
        status?: string;
        tags?: string[];
        title?: string;
        views?: number;
    };

    @IsOptional()
    @IsObject()
    seo?: {
        canonical?: string;
        description?: string;
        keywords?: string[];
    };
}
// src/modules/blog/posts/dto/create-post.dto.ts

import { PostDto } from '@src/modules/blog/posts/dto/post.dto'; // Import PostDto usando alias @src.
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsObject, IsArray } from 'class-validator'; // Import decorators de validação

export class CreatePostDto {
    @IsNotEmpty()
    @IsString()
    categoryId: string;

    @IsNotEmpty()
    @IsString()
    subcategoryId: string;

    @IsNotEmpty()
    @IsString()
    contentHTML: string;

    @IsNotEmpty()
    @IsObject()
    postInfo: {
    @IsOptional() // authorId pode ser opcional durante a criação
    authorId?: string;
    @IsNotEmpty()
    excerpt: string;
    @IsOptional()
    featuredImageURL?: string;
    @IsOptional()
    modifiedDate?: string;
    @IsNotEmpty()
    publishDate: string;
    @IsOptional()
    @IsNumber()
    readingTime?: number;
    @IsNotEmpty()
    slug: string;
    @IsOptional()
    status?: string;
    @IsArray() // Validação que tags é um array
    @IsOptional()
    tags?: string[];
    @IsNotEmpty()
    title: string;
    @IsOptional()
    @IsNumber()
    views?: number;
};

@IsOptional()
@IsObject()
seo ?: {
    canonical?: string;
    description?: string;
    @IsArray() // Validação que keywords é um array
@IsOptional()
keywords ?: string[];
  };
}
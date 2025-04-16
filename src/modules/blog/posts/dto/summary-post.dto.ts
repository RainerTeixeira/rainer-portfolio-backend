// src/posts/dto/summary-post.dto.ts
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsUrl,
    IsDateString,
    IsEnum,
    IsArray,
    IsNumber,
    IsPositive,
} from 'class-validator';
// Importar o enum de base-post.dto.ts
import { PostStatus } from './base-post.dto';

/**
 * DTO para representar um resumo de um Post.
 * Ideal para listagens, cards ou previews, omitindo campos pesados como 'content'.
 */
export class SummaryPostDto {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsNotEmpty()
    excerpt: string;

    @IsEnum(PostStatus)
    status: PostStatus;

    @IsString()
    @IsNotEmpty()
    authorId: string;

    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    subcategoryId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional() // PublishDate pode não existir se for draft
    @IsDateString()
    publishDate?: string;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    views?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    likes?: number;

    @IsOptional()
    @IsNumber()
    @IsPositive()
    commentCount?: number;

    @IsOptional()
    @IsUrl()
    postPictureUrl?: string;

    @IsOptional()
    @IsDateString()
    createdAt?: string;

    @IsOptional()
    @IsDateString()
    lastUpdatedDate?: string;
}
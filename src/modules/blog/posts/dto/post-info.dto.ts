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
    @IsString()
    authorName?: string;

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
    @IsNotEmpty()
    publishDate: string;

    @IsOptional()
    @IsNumber()
    readingTime?: number;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsOptional()
    @IsString()
    status?: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsNumber()
    views?: number;

    constructor(
        publishDate: string,
        slug: string,
        title: string,
        authorId?: string,
        authorName?: string, // Adicione authorName ao construtor
        tags?: string[],
        excerpt?: string,
        featuredImageURL?: string,
        modifiedDate?: string,
        readingTime?: number,
        status?: string,
        views?: number,
    ) {
        this.publishDate = publishDate;
        this.slug = slug;
        this.title = title;
        this.authorId = authorId;
        this.authorName = authorName; // Inicialize authorName no construtor
        this.tags = tags;
        this.excerpt = excerpt;
        this.featuredImageURL = featuredImageURL;
        this.modifiedDate = modifiedDate;
        this.readingTime = readingTime;
        this.status = status;
        this.views = views;
    }
}
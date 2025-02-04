// src/controller/blog/posts/dto/updatePost.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './createPost.dto';

export class UpdatePostDto {
    postTitle?: string;
    postContent?: string;
    postSummary?: string;
    postLastUpdated?: string; // Data no formato ISO string
    postReadingTime?: number;
    postStatus?: number;
    postTags?: string[];
    postImages?: string[]; // URLs das imagens.
    postVideoEmbedUrls?: string[]; // URLs dos vídeos incorporados
    references?: { referenceId: number, title: string, url: string }[];
    relatedPosts?: number[]; // IDs de posts relacionados
    comments?: number[]; // IDs dos comentários
    authorIds?: number[]; // IDs dos autores
    category?: { CategoryId: number, subCategoryId: number }; // Categoria do post
    sections?: { sectionId: number, title: string, content: string, type: string }[];
    seo?: { canonicalUrl: string, description: string, keywords: string[] };
    viewsCount?: number;
}

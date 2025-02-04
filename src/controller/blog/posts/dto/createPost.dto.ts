// src/controller/blog/posts/dto/createPost.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreatePostDto {
  postTitle: string;
  postContent: string;
  postSummary: string;
  postDate: string; // Data no formato ISO string
  postLastUpdated: string; // Data no formato ISO string
  postReadingTime: number;
  postStatus: number;
  postTags: string[];
  postImages: string[]; // URLs das imagens
  postVideoEmbedUrls: string[]; // URLs dos vídeos incorporados
  references: { referenceId: number, title: string, url: string }[];
  relatedPosts: number[]; // IDs de posts relacionados
  comments: number[]; // IDs dos comentários
  authorIds: number[]; // IDs dos autores
  category: { CategoryId: number, subCategoryId: number }; // Categoria do post
  sections: { sectionId: number, title: string, content: string, type: string }[];
  seo: { canonicalUrl: string, description: string, keywords: string[] };
  viewsCount: number;
}

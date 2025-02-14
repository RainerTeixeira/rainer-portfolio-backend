// src/modules/blog/posts/dto/create-post.dto.ts

import { IsOptional, IsString, IsObject } from 'class-validator';

export class CreatePostDto {
  @IsString()
  categoryId: string;

  @IsString()
  subcategoryId: string;

  @IsString()
  contentHTML: string;

  @IsObject()
  postInfo: { authorId?: string; tags?: string; excerpt?: string; publishDate?: string; slug?: string; title?: string; status?: string }; // Adicione as propriedades faltantes

  @IsString()
  excerpt: string;

  @IsString()
  publishDate: string;

  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsObject()
  seo?: {
    @IsOptional()
  @IsString()
  canonical?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString({ each: true })
  keywords?: string[]; // Corrigido para array de strings
};

constructor(
  categoryId: string,
  subcategoryId: string,
  contentHTML: string,
  postInfo: { authorId?: string; tags?: string; excerpt?: string; publishDate?: string; slug?: string; title?: string; status?: string }, // Adicione as propriedades faltantes
  excerpt: string,
  publishDate: string,
  slug: string,
  title: string,
  seo ?: { canonical?: string; description?: string; keywords?: string[] } // Corrigido para array de strings
) {
  this.categoryId = categoryId;
  this.subcategoryId = subcategoryId;
  this.contentHTML = contentHTML;
  this.postInfo = postInfo;
  this.excerpt = excerpt;
  this.publishDate = publishDate;
  this.slug = slug;
  this.title = title;
  this.seo = seo;
}
}
// src/modules/blog/posts/dto/create-post.dto.ts

import { IsNotEmpty, IsString, IsOptional, IsObject, IsArray } from 'class-validator';

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
    authorId?: string; // authorId pode ser opcional durante a criação
    tags?: string[];
  };

  @IsNotEmpty()
  @IsString()
  excerpt: string;

  @IsNotEmpty()
  @IsString()
  publishDate: string;

  @IsNotEmpty()
  @IsString()
  slug: string;

  @IsNotEmpty()
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
  @IsArray()
  @IsString({ each: true }) // Garante que cada item do array é string
  keywords?: string[];
};

constructor(
  categoryId: string,
  subcategoryId: string,
  contentHTML: string,
  postInfo: { authorId?: string; tags?: string[] },
  excerpt: string,
  publishDate: string,
  slug: string,
  title: string,
  seo ?: { canonical?: string; description?: string; keywords?: string[] }
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
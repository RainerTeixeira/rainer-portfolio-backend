// src/modules/blog/posts/dto/create-post.dto.ts

import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class CreatePostDto {
  @IsString()
  categoryId: string;

  @IsString()
  subcategoryId: string;

  @IsString()
  contentHTML: string;

  @IsObject()
  postInfo: {
        @IsOptional()
  authorId?: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
};

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
seo ?: {
        @IsOptional()
@IsString()
canonical ?: string;
@IsOptional()
@IsString()
description ?: string;
@IsOptional()
@IsArray()
@IsString({ each: true })
keywords ?: string[];
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
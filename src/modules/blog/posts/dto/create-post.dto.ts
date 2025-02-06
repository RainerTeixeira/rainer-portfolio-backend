// src/controller/blog/posts/dto/createPost.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  ValidateNested,
  IsISO8601
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO para referências do post
export class ReferenceDto {
  @IsNumber()
  referenceId!: number;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  url!: string;
}

// DTO para categoria do post
export class CategoryDto {
  @IsNumber()
  CategoryId!: number;

  @IsNumber()
  subCategoryId!: number;
}

// DTO para cada seção do post
export class SectionDto {
  @IsNumber()
  sectionId!: number;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;
}

// DTO para dados de SEO
export class SeoDto {
  @IsString()
  @IsNotEmpty()
  canonicalUrl!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @IsString({ each: true })
  keywords!: string[];
}

// DTO principal para criação do post
export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  postTitle!: string;

  @IsString()
  @IsNotEmpty()
  postContent!: string;

  @IsString()
  @IsNotEmpty()
  postSummary!: string;

  @IsString()
  @IsNotEmpty()
  @IsISO8601()
  postDate!: string; // Data no formato ISO string

  @IsString()
  @IsNotEmpty()
  @IsISO8601()
  postLastUpdated!: string; // Data no formato ISO string

  @IsNumber()
  @IsNotEmpty()
  postReadingTime!: number;

  @IsNumber()
  @IsNotEmpty()
  postStatus!: number;

  @IsArray()
  @IsString({ each: true })
  postTags!: string[];

  @IsArray()
  @IsString({ each: true })
  postImages!: string[]; // URLs das imagens

  @IsArray()
  @IsString({ each: true })
  postVideoEmbedUrls!: string[]; // URLs dos vídeos incorporados

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDto)
  references!: ReferenceDto[];

  @IsArray()
  @IsNumber({}, { each: true })
  relatedPosts!: number[]; // IDs de posts relacionados

  @IsArray()
  @IsNumber({}, { each: true })
  comments!: number[]; // IDs dos comentários

  @IsArray()
  @IsNumber({}, { each: true })
  authorIds!: number[]; // IDs dos autores

  @ValidateNested()
  @Type(() => CategoryDto)
  category!: CategoryDto; // Categoria do post

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections!: SectionDto[];

  @ValidateNested()
  @Type(() => SeoDto)
  seo!: SeoDto;

  @IsNumber()
  @IsNotEmpty()
  viewsCount!: number;
}


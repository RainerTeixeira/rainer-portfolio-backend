// src/modules/blog/categories/dto/update-category.dto.ts
import { IsOptional, IsString, IsArray } from 'class-validator'; // Importe IsArray
import { CategorySeoDto } from './category-seo.dto'; // Importe o DTO de SEO

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  seo?: CategorySeoDto; // Use o DTO de SEO aqui e torne opcional
}
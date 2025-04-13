// src/modules/blog/categories/dto/update-category.dto.ts
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CategorySeoDto } from './category-seo.dto';

/**
 * DTO para atualização de uma categoria.
 */
export class UpdateCategoryDto {
  /** Nome da categoria (opcional) */
  @IsOptional()
  @IsString()
  name?: string;

  /** Slug único da categoria (opcional) */
  @IsOptional()
  @IsString()
  slug?: string;

  /** Informações de SEO (opcional) */
  @IsOptional()
  @ValidateNested()
  @Type(() => CategorySeoDto)
  seo?: CategorySeoDto;
}
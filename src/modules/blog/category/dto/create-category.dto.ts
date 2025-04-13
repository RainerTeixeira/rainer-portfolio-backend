// src/modules/blog/categories/dto/create-category.dto.ts
import { IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CategorySeoDto } from './category-seo.dto';

/**
 * DTO para criação de uma categoria.
 */
export class CreateCategoryDto {
  /** ID único da categoria */
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  /** Nome da categoria */
  @IsString()
  @IsNotEmpty()
  name: string;

  /** Slug único da categoria */
  @IsString()
  @IsNotEmpty()
  slug: string;

  /** Informações de SEO */
  @ValidateNested()
  @Type(() => CategorySeoDto)
  seo: CategorySeoDto;
}
// src/modules/blog/category/dto/category.dto.ts
import { CategorySeoDto } from './category-seo.dto';

/**
 * DTO para representar uma categoria.
 */
export class CategoryDto {
  /** ID único da categoria */
  categoryId: string;

  /** Nome da categoria */
  name: string;

  /** Slug único da categoria */
  slug: string;

  /** Informações de SEO */
  seo: CategorySeoDto;
}
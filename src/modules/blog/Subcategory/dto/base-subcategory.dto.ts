// base-subcategory.dto.ts
import { IsString, IsNumber } from 'class-validator';

export class BaseSubcategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsNumber()
  post_count: number;

  @IsString()
  parent_category_id: string;

  @IsString()
  parent_category_slug: string;

  @IsString()
  meta_description: string;
}

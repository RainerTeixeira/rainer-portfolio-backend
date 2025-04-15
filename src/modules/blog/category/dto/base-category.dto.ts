// base-category.dto.ts
import { IsString, IsArray, IsNumber } from 'class-validator';

export class BaseCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  keywords: string[];

  @IsNumber()
  post_count: number;

  @IsString()
  meta_description: string;
}
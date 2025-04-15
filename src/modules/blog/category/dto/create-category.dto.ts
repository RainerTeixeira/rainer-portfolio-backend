// src/modules/blog/categories/dto/create-category.dto.ts
import { BaseCategoryDto } from './base-category.dto';
import { IsNotEmpty } from 'class-validator';

export class CreateCategoryDto extends BaseCategoryDto {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  created_at!: string;
}
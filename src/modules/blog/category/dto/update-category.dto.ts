// src/modules/blog/categories/dto/update-category.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { BaseCategoryDto } from './base-category.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateCategoryDto extends PartialType(BaseCategoryDto) {
  @IsNotEmpty()
  updated_at!: string;
}
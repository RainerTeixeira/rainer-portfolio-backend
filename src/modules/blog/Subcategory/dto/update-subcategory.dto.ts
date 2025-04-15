// update-subcategory.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { BaseSubcategoryDto } from './base-subcategory.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateSubcategoryDto extends PartialType(BaseSubcategoryDto) {
  @IsNotEmpty()
  updated_at!: string;
}
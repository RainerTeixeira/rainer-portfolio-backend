// create-subcategory.dto.ts
import { BaseSubcategoryDto } from './base-subcategory.dto';
import { IsNotEmpty } from 'class-validator';

export class CreateSubcategoryDto extends BaseSubcategoryDto {
  @IsNotEmpty()
  id!: string;

  @IsNotEmpty()
  created_at!: string;
}
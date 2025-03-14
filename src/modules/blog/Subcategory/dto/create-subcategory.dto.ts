// src/modules/blog/subcategory/dto/create-subcategory.dto.ts

import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubcategoryDto {
  @ApiProperty({ description: 'ID da categoria e subcategoria concatenados' })
  @IsNotEmpty()
  @IsString()
  categoryIdSubcategoryId: string;

  @ApiProperty({ description: 'ID da subcategoria' })
  @IsNotEmpty()
  @IsString()
  subcategoryId: string;

  @ApiProperty({ description: 'Nome da subcategoria' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Slug da subcategoria' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Descrição da subcategoria', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Palavras-chave da subcategoria', required: false })
  @IsOptional()
  @IsString()
  keywords?: string;

  @ApiProperty({ description: 'Título da subcategoria', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  constructor(categoryIdSubcategoryId: string, subcategoryId: string, name: string, slug: string, description?: string, keywords?: string, title?: string) {
    this.categoryIdSubcategoryId = categoryIdSubcategoryId;
    this.subcategoryId = subcategoryId;
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.keywords = keywords;
    this.title = title;
  }
}
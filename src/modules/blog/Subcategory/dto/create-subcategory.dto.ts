// src/modules/blog/subcategory/dto/create-subcategory.dto.ts

import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
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

  @ApiProperty({ description: 'ID da categoria' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

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

  @ApiProperty({ description: 'SEO da subcategoria', required: false })
  @IsOptional()
  @IsObject()
  seo?: Record<string, unknown>;

  constructor(
    categoryIdSubcategoryId: string,
    subcategoryId: string,
    name: string,
    slug: string,
    categoryId: string,
    description?: string,
    keywords?: string,
    title?: string,
    seo?: Record<string, unknown>
  ) {
    this.categoryIdSubcategoryId = categoryIdSubcategoryId;
    this.subcategoryId = subcategoryId;
    this.name = name;
    this.slug = slug;
    this.categoryId = categoryId;
    this.description = description;
    this.keywords = keywords;
    this.title = title;
    this.seo = seo;
  }
}
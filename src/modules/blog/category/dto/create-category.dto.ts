// src/modules/blog/categories/dto/create-category.dto.ts

import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    categoryId: string;

    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsOptional()
    @IsObject()
    seo?: {
        @IsOptional()
    @IsString()
    canonical?: string;
    @IsOptional()
    @IsString()
    description?: string;
    @IsOptional()
    @IsString({ each: true }) // Aplica IsString a cada item do array
    keywords?: string[];
};

constructor(categoryId: string, name: string, slug: string, seo ?: { canonical?: string, description?: string, keywords?: string[] }) {
    this.categoryId = categoryId;
    this.name = name;
    this.slug = slug;
    this.seo = seo;
}
}
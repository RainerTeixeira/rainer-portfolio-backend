// src/modules/blog/categories/dto/create-category.dto.ts

import { IsNotEmpty, IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class CreateCategoryDto {
    @IsNotEmpty()
    @IsString()
    categoryId: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
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
        @IsArray()
        keywords?: string[];
    };

    constructor(categoryId: string, name: string, slug: string, seo?: { canonical?: string, description?: string, keywords?: string[] }){
        this.categoryId = categoryId;
        this.name = name;
        this.slug = slug;
        this.seo = seo;
    }
}
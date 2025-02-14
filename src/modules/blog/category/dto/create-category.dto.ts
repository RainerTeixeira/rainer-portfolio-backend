// src/modules/blog/categories/dto/create-category.dto.ts

import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    categoryId: string;

    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsOptional()
    seo?: {
        canonical?: string;
        description?: string;
        keywords?: string;
    };

    constructor(categoryId: string, name: string, slug: string, seo?: { canonical?: string; description?: string; keywords?: string }) {
        this.categoryId = categoryId;
        this.name = name;
        this.slug = slug;
        this.seo = seo;
    }
}
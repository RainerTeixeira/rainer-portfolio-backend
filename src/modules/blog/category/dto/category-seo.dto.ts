// src/modules/blog/categories/dto/category-seo.dto.ts
import { IsOptional, IsString, IsArray } from 'class-validator';

export interface CategorySeoDto {
    canonical?: string;
    description?: string;
    keywords?: string[];
    metaTitle?: string;
    priority?: string;
}
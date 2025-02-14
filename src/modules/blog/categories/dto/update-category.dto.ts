// src/modules/blog/categories/dto/update-category.dto.ts

import { CategoryDto } from '@src/modules/blog/categories/dto/category.dto'; // Import CategoryDto usando alias @src.
import { IsOptional, IsString, IsObject, IsNumber } from 'class-validator'; // Import decorators de validação (mantenha este import - pacote externo).

export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsObject()
    seo?: {
        metaTitle?: string;
        priority?: number;
    };
}
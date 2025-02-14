// src/modules/blog/categories/dto/update-category.dto.ts

import { CategoryDto } from './category.dto';
import { IsOptional, IsString, IsObject, IsNumber } from 'class-validator'; // Import decorators de validação

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
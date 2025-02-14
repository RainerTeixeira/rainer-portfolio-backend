// src/modules/blog/categories/dto/create-category.dto.ts

import { CategoryDto } from './category.dto';
import { IsNotEmpty, IsString, IsOptional, IsObject, IsNumber } from 'class-validator'; // Import decorators de validação

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

    @IsObject() // Validação que seo é um objeto (opcional)
    @IsOptional()
    seo?: {
        metaTitle?: string;
        priority?: number;
    };
}
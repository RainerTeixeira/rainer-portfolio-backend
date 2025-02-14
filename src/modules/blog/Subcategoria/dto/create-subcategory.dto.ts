// src/modules/blog/subcategoria/dto/create-subcategoria.dto.ts

import { SubcategoriaDto } from './subcategoria.dto';
import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator'; // Import decorators de validação

export class CreateSubcategoriaDto {
    @IsNotEmpty()
    @IsString()
    categoryId: string;

    @IsNotEmpty()
    @IsString()
    subcategoryId: string;

    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    slug: string;

    @IsOptional()
    @IsObject()
    seo?: {
        description?: string;
        keywords?: string;
        title?: string;
    };
}
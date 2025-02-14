// src/modules/blog/subcategoria/dto/update-subcategoria.dto.ts

import { SubcategoriaDto } from '@src/modules/blog/subcategoria/dto/subcategory.dto'; // Import SubcategoriaDto usando alias @src.
import { IsOptional, IsString, IsObject } from 'class-validator'; // Import decorators de validação

export class UpdateSubcategoriaDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsObject()
    seo?: {
        description?: string;
        keywords?: string;
        title?: string;
    };
}
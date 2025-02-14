// src/modules/blog/subcategoria/dto/update-subcategoria.dto.ts

import { SubcategoriaDto } from '@src/modules/blog/subcategory/dto/subcategory.dto'; // Importa SubcategoriaDto usando alias @src.
import { IsOptional, IsString, IsObject } from 'class-validator'; // Import decorators de validação

import { IsString, IsOptional } from 'class-validator';

export class UpdateSubcategoryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    keywords?: string;

    @IsOptional()
    @IsString()
    title?: string;

    constructor(name?: string, slug?: string, description?: string, keywords?: string, title?: string) {
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.keywords = keywords;
        this.title = title;
    }
}
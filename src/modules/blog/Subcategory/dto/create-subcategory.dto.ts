// src/modules/blog/subcategoria/dto/create-subcategoria.dto.ts

import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateSubcategoryDto {
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
    @IsString()
    description?: string;

    constructor(categoryId: string, subcategoryId: string, name: string, slug: string, description?: string) {
        this.categoryId = categoryId;
        this.subcategoryId = subcategoryId;
        this.name = name;
        this.slug = slug;
        this.description = description;
    }
}
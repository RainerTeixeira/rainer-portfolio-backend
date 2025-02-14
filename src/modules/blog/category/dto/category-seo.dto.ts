// src/modules/blog/categories/dto/category-seo.dto.ts
import { IsOptional, IsString, IsArray } from 'class-validator';

export class CategorySeoDto {
    @IsOptional()
    @IsString()
    canonical?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsArray() // Use IsArray para keywords que é um array de strings
    @IsString({ each: true }) // Garante que cada item no array é uma string
    keywords?: string[];
}
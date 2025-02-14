// src/modules/blog/categories/dto/update-category.dto.ts

import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

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
        @IsOptional()
    @IsString()
    canonical?: string;
    @IsOptional()
    @IsString()
    description?: string;
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];
};
}
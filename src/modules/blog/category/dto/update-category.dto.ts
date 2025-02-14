// src/modules/blog/categories/dto/update-category.dto.ts

import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    seo?: {
    @IsOptional()
    @IsString()
    canonical?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    keywords?: string;
};

  // ... outras propriedades
}
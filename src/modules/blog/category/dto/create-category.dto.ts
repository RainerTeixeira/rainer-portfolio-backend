// src/modules/blog/categories/dto/create-category.dto.ts
import { IsOptional, IsString } from 'class-validator';
import { CategorySeoDto } from './category-seo.dto'; // Importe o DTO de SEO

export class CreateCategoryDto {
    @IsString()
    categoryId: string;

    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsOptional()
    seo?: CategorySeoDto; // Use o DTO de SEO aqui e torne opcional

    // Removendo o construtor para evitar a instanciação da classe dentro do DTO
    /*constructor(
        categoryId: string,
        name: string,
        slug: string,
        seo?: CategorySeoDto, // Use o DTO de SEO no construtor e torne opcional
    ) {
        this.categoryId = categoryId;
        this.name = name;
        this.slug = slug;
        this.seo = seo;
    }*/
}
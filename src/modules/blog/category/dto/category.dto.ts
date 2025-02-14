// src/modules/blog/category/dto/category.dto.ts
import { CategorySeoDto } from './category-seo.dto'; // Importe o DTO de SEO

export class CategoryDto {
    categoryId: string;
    name: string;
    slug: string;
    seo?: CategorySeoDto; // Use o DTO de SEO aqui e torne opcional

    constructor(
        categoryId: string,
        name: string,
        slug: string,
        seo?: CategorySeoDto, // Use o DTO de SEO no construtor e torne opcional
    ) {
        this.categoryId = categoryId;
        this.name = name;
        this.slug = slug;
        this.seo = seo;
    }
}
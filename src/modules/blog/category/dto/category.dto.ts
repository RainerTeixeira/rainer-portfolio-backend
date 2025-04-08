// src/modules/blog/category/dto/category.dto.ts
import { CategorySeoDto } from './category-seo.dto'; // Importe o DTO de SEO

export class CategoryDto {
    categoryId: string;
    name: string;
    slug: string;
    seo?: CategorySeoDto; // Use o DTO de SEO aqui e torne opcional

    // Removendo o construtor para evitar a instanciação da classe dentro do DTO
}
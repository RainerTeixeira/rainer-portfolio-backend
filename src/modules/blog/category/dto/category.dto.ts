// src/modules/blog/category/dto/category.dto.ts

export class CategoryDto {
    categoryId: string; // Chave de Partição (categoryId) - String
    name: string;
    slug: string;
    seo: {
        metaTitle?: string; // Map com campos opcionais
        priority?: number;
    };
}
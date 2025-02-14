// src/modules/blog/category/dto/category.dto.ts

export class CategoryDto {
    categoryId: string; // Chave de Partição (categoryId) - String
    name: string;
    slug: string;
    seo: {
        canonical?: string;
        description?: string;
        keywords?: string[];
    };

    constructor(categoryId: string, name: string, slug: string, seo: { canonical?: string, description?: string, keywords?: string[] }) {
        this.categoryId = categoryId;
        this.name = name;
        this.slug = slug;
        this.seo = seo;
    }
}
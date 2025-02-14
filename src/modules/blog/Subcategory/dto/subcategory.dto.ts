// src/modules/blog/Subcategory/dto/Subcategory.dto.ts

export class SubcategoryDto {
    categoryIdSubcategoryId: string; // Chave de Partição composta (categoryId#subcategoryId) - String
    subcategoryId: string; // Chave de Classificação (subcategoryId) - String
    name: string;
    slug: string;
    description?: string;
    keywords?: string;
    title?: string;

    constructor(categoryIdSubcategoryId: string, subcategoryId: string, name: string, slug: string, description?: string, keywords?: string, title?: string) {
        this.categoryIdSubcategoryId = categoryIdSubcategoryId;
        this.subcategoryId = subcategoryId;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.keywords = keywords;
        this.title = title;
    }
}
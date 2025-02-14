// src/modules/blog/subcategoria/dto/subcategoria.dto.ts

export class SubcategoriaDto {
    'categoryId#subcategoryId': string; // Chave de Partição composta (categoryId#subcategoryId) - String
    subcategoryId: string; // Chave de Classificação (subcategoryId) - String
    name: string;
    slug: string;
    seo: { // Map aninhado
        description?: string;
        keywords?: string;
        title?: string;
    };
}
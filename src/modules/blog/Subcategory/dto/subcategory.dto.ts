import { ApiProperty } from '@nestjs/swagger';

// src/modules/blog/Subcategory/dto/Subcategory.dto.ts

export class SubcategoryDto {
    @ApiProperty({ description: 'Chave de Partição composta (categoryId#subcategoryId)' })
    categoryIdSubcategoryId: string; // Chave de Partição composta (categoryId#subcategoryId) - String

    @ApiProperty({ description: 'Chave de Classificação (subcategoryId)' })
    subcategoryId: string; // Chave de Classificação (subcategoryId) - String

    @ApiProperty({ description: 'Nome da subcategoria' })
    name: string;

    @ApiProperty({ description: 'Slug da subcategoria' })
    slug: string;

    @ApiProperty({ description: 'Descrição da subcategoria', required: false })
    description?: string;

    @ApiProperty({ description: 'Palavras-chave da subcategoria', required: false })
    keywords?: string;

    @ApiProperty({ description: 'Título da subcategoria', required: false })
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
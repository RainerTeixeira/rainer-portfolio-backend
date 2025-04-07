import { ApiProperty } from '@nestjs/swagger';

// src/modules/blog/Subcategory/dto/Subcategory.dto.ts

export class SubcategoryDto {
  @ApiProperty({ description: 'Chave de Partição composta (categoryId#subcategoryId)' })
  categoryIdSubcategoryId!: string;

  @ApiProperty({ description: 'Chave de Classificação (subcategoryId)' })
  subcategoryId!: string;

  @ApiProperty({ description: 'Nome da subcategoria' })
  name!: string;

  @ApiProperty({ description: 'Slug da subcategoria' })
  slug!: string;

  @ApiProperty({ description: 'Descrição da subcategoria', required: false })
  description?: string;

  @ApiProperty({ description: 'SEO da subcategoria', required: false })
  seo?: {
    description?: string;
    keywords?: string | string[]; // Garantir que 'keywords' seja reconhecida
    title?: string;
  };

  @ApiProperty({ description: 'Palavras-chave da subcategoria', required: false })
  keywords?: string | string[]; // Adicionando a propriedade 'keywords'

  @ApiProperty({ description: 'Título da subcategoria', required: false })
  title?: string; // Adicionando a propriedade 'title'

  constructor(
    categoryIdSubcategoryId: string,
    subcategoryId: string,
    name: string,
    slug: string,
    description?: string,
    seo?: { description?: string; keywords?: string | string[]; title?: string },
    keywords?: string | string[],
    title?: string // Adicionando 'title' ao construtor
  ) {
    this.categoryIdSubcategoryId = categoryIdSubcategoryId;
    this.subcategoryId = subcategoryId;
    this.name = name;
    this.slug = slug;
    this.description = description;
    this.seo = seo;
    this.keywords = keywords; // Inicializando 'keywords'
    this.title = title; // Inicializando 'title'
  }
}
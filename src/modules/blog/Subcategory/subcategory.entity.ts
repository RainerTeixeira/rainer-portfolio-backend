// src/modules/blog/subcategory/subcategory.entity.ts
import { ApiProperty } from '@nestjs/swagger';

/**
 * @SubcategoryEntity
 *
 * Entidade que representa uma subcategoria no sistema.
 *
 * PK: SUBCAT#id
 * SK: METADATA
 */
export class SubcategoryEntity {
  @ApiProperty({ description: 'Chave de partição no formato SUBCAT#id' })
  id: string;

  @ApiProperty({ description: 'Chave de classificação fixa METADATA' })
  metadata: string = 'METADATA';

  @ApiProperty({ description: 'Nome da subcategoria' })
  name: string;

  @ApiProperty({ description: 'Slug amigável da subcategoria' })
  slug: string;

  @ApiProperty({ description: 'Descrição da subcategoria' })
  description: string;

  @ApiProperty({ description: 'Meta descrição para SEO' })
  metaDescription: string;

  @ApiProperty({ description: 'ID da categoria pai' })
  parentCategoryId: string;

  @ApiProperty({ description: 'Slug da categoria pai' })
  parentCategorySlug: string;

  @ApiProperty({ description: 'Total de posts nesta subcategoria' })
  postCount: number;

  @ApiProperty({ description: 'Data de criação do registro' })
  createdAt: string;

  @ApiProperty({ description: 'Data da última atualização' })
  updatedAt: string;

  @ApiProperty({ description: 'Tipo do registro (SUBCATEGORY)' })
  type: string = 'SUBCATEGORY';

  @ApiProperty({
    description: 'Propriedades do GSI_ParentCategory (parent_category_id, created_at)',
    type: 'object',
    properties: { parentCategoryId: { type: 'string' }, createdAt: { type: 'string' } }
  })
  parentGSI?: { parentCategoryId: string; createdAt: string };

  @ApiProperty({
    description: 'Propriedades do GSI_Slug (slug, type)',
    type: 'object',
    properties: { slug: { type: 'string' }, type: { type: 'string' } }
  })
  slugGSI?: { slug: string; type: string };

  constructor(partial?: Partial<SubcategoryEntity>) {
    Object.assign(this, partial);
  }
}

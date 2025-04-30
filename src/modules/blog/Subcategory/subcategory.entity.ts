/**
 * @file subcategory.entity.ts
 * @description
 * Define a estrutura da entidade Subcategory utilizada no domínio do blog.
 * Representa os dados persistidos no DynamoDB e expostos pela API.
 * 
 * Principais responsabilidades:
 * - Tipar e documentar todos os campos da subcategoria, incluindo informações de SEO e relacionamento com categoria pai.
 * - Facilitar a integração com o Swagger para documentação automática.
 * - Fornecer construtor que permite inicialização parcial da entidade.
 * 
 * Observações:
 * - A entidade é utilizada em DTOs, controllers e serviços para garantir consistência dos dados.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Entidade que representa uma subcategoria no domínio do blog.
 * Utilizada para mapear os dados armazenados no DynamoDB e expor propriedades relevantes para a aplicação.
 * Inclui campos para integração com índices secundários globais (GSI) e propriedades de SEO.
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

  /**
   * Construtor que permite inicializar a entidade a partir de um objeto parcial.
   * @param partial Objeto parcial para inicialização.
   */
  constructor(partial?: Partial<SubcategoryEntity>) {
    Object.assign(this, partial);
  }
}

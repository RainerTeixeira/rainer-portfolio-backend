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

/**
 * Entidade que representa uma subcategoria no domínio do blog.
 * Utilizada para mapear os dados armazenados no DynamoDB e expor propriedades relevantes para a aplicação.
 * Inclui campos para integração com índices secundários globais (GSI) e propriedades de SEO.
 */
export class SubcategoryEntity {
  /** Chave de partição no formato SUBCAT#id */
  id: string;

  /** Chave de classificação fixa METADATA */
  metadata: string = 'METADATA';

  /** Nome da subcategoria */
  name: string;

  /** Slug amigável da subcategoria */
  slug: string;

  /** Descrição da subcategoria */
  description: string;

  /** Meta descrição para SEO */
  metaDescription: string;

  /** ID da categoria pai */
  parentCategoryId: string;

  /** Slug da categoria pai */
  parentCategorySlug: string;

  /** Total de posts nesta subcategoria */
  postCount: number;

  /** Data de criação do registro */
  createdAt: string;

  /** Data da última atualização */
  updatedAt: string;

  /** Tipo do registro (SUBCATEGORY) */
  type: string = 'SUBCATEGORY';

  /** Propriedades do GSI_ParentCategory (parent_category_id, created_at) */
  parentGSI?: { parentCategoryId: string; createdAt: string };

  /** Propriedades do GSI_Slug (slug, type) */
  slugGSI?: { slug: string; type: string };

  /**
   * Construtor que permite inicializar a entidade a partir de um objeto parcial.
   * @param partial Objeto parcial para inicialização.
   */
  constructor(partial?: Partial<SubcategoryEntity>) {
    Object.assign(this, partial);
  }
}

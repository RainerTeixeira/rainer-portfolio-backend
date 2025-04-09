/**
 * Representa a tabela "Subcategory" no banco de dados.
 * Chave de partição: categoryId_subcategoryId
 * Chave de classificação: subcategoryId
 */
export class Subcategory {
  /** Chave de partição composta pela categoria e subcategoria */
  categoryId_subcategoryId: string;

  /** Chave de classificação única para identificar a subcategoria */
  subcategoryId: string;

  /** Nome da subcategoria */
  name: string;

  /** Informações de SEO para a subcategoria */
  seo: {
    /** Descrição para SEO */
    description: string;

    /** Palavras-chave para SEO */
    keywords: string;

    /** Título meta para SEO */
    title: string;
  };

  /** Slug único para a subcategoria */
  slug: string;
}

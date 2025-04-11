/**
 * Representa a tabela "Category" no banco de dados.
 * Chave de partição: categoryId
 */
export class Category {
  /** Chave de partição única para identificar a categoria */
  categoryId: string;

  /** Nome da categoria */
  name: string;

  /** Informações de SEO para a categoria */
  seo: {
    /** Título meta para SEO */
    metaTitle: string;

    /** Prioridade da categoria para SEO */
    priority: number;
  };

  /** Slug único para a categoria */
  slug: string;
}

/**
 * Representa a tabela "Category" no banco de dados.
 */
export class Category {
  /** Chave de partição única para identificar a categoria */
  categoryId: string;

  /** Nome da categoria */
  name: string;

  /** Slug único para a categoria */
  slug: string;

  /** Informações de SEO para a categoria */
  seo: {
    /** Título meta para SEO */
    metaTitle: string;

    /** Prioridade da categoria para SEO */
    priority: string;
  };
}

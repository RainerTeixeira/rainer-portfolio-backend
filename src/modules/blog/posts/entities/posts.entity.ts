/**
 * Representa a tabela "Posts" no banco de dados.
 * Chave de partição: categoryId_subcategoryId
 * Chave de classificação: postId
 */
export class Posts {
  /** Chave de partição composta pela categoria e subcategoria */
  categoryId_subcategoryId: string;

  /** Chave de classificação única para identificar o post */
  postId: string;

  /** ID do autor do post */
  authorId: string;

  /** URL canônica do post */
  canonical: string;

  /** ID da categoria do post */
  categoryId: string;

  /** Conteúdo HTML do post */
  contentHTML: string;

  /** Descrição do post */
  description: string;

  /** URL da imagem destacada do post */
  featuredImageURL: string;

  /** Palavras-chave associadas ao post */
  keywords: string[];

  /** Data de última modificação do post */
  modifiedDate: string;

  /** Data de publicação do post */
  publishDate: string;

  /** Tempo estimado de leitura do post (em minutos) */
  readingTime: number;

  /** Slug único para o post */
  slug: string;

  /** Status do post (e.g., published, draft) */
  status: string;

  /** ID da subcategoria do post */
  subcategoryId: string;

  /** Tags associadas ao post */
  tags: string[];

  /** Título do post */
  title: string;

  /** Número de visualizações do post */
  views: number;
}

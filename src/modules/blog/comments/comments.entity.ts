/**
 * Representa a tabela "Comments" no banco de dados.
 * Chave de partição: postId
 * Chave de classificação: commentId
 */
export class Comments {
  /** Chave de partição que identifica o post relacionado ao comentário */
  postId: string;

  /** Chave de classificação única para identificar o comentário */
  commentId: string;

  /** Conteúdo do comentário */
  content: string;

  /** Data de criação do comentário */
  date: string;

  /** Status do comentário (e.g., published, pending) */
  status: string;
}

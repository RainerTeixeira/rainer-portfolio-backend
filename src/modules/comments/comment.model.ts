/**
 * Modelo de Comentário
 * 
 * Define a estrutura de dados para comentários em posts.
 * Suporta threads (parentId) e moderação.
 * 
 * @module modules/comments/comment.model
 */

export interface Comment {
  id: string;
  content: string;
  contentJson?: any | null;
  authorId: string;
  postId: string;
  parentId?: string | null; // Para threads
  isApproved: boolean;
  isReported: boolean;
  reportReason?: string | null;
  isEdited: boolean;
  likesCount: number;
  createdAt: Date;
  /** Data de última atualização (null até primeira atualização real - economia de espaço) */
  updatedAt: Date | null;
  editedAt?: Date | null;
}

export interface CreateCommentData {
  content: string;
  contentJson?: any;
  authorId: string;
  postId: string;
  parentId?: string | null;
}

export interface UpdateCommentData {
  content?: string;
  contentJson?: any;
  isApproved?: boolean;
  isReported?: boolean;
  reportReason?: string;
  isEdited?: boolean;
}


/**
 * Modelo de Comment
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
  updatedAt: Date;
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


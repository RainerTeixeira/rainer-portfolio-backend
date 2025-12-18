/**
 * Interface do repositório de comentários (contrato)
 */

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentRepository {
  create(data: Omit<Comment, 'createdAt' | 'updatedAt'>): Promise<Comment>;
  findById(id: string): Promise<Comment | null>;
  findByPostId(postId: string, options?: { limit?: number; offset?: number }): Promise<Comment[]>;
  findByAuthorId(authorId: string, options?: { limit?: number; offset?: number }): Promise<Comment[]>;
  findReplies(parentId: string): Promise<Comment[]>;
  update(id: string, data: Partial<Comment>): Promise<Comment | null>;
  delete(id: string): Promise<void>;
  approve(id: string): Promise<void>;
  reject(id: string): Promise<void>;
}

export const COMMENT_REPOSITORY = 'COMMENT_REPOSITORY';

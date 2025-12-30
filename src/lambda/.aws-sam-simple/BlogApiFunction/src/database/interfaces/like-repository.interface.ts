/**
 * Interface do repositório de likes (contrato)
 */

export interface Like {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: Date;
}

export interface LikeRepository {
  create(data: Omit<Like, 'createdAt'>): Promise<Like>;
  findById(id: string): Promise<Like | null>;
  findByUserAndPost(userId: string, postId: string): Promise<Like | null>;
  findByUserAndComment(userId: string, commentId: string): Promise<Like | null>;
  findByPost(postId: string): Promise<Like[]>;
  findByComment(commentId: string): Promise<Like[]>;
  findByUser(userId: string): Promise<Like[]>;
  delete(id: string): Promise<void>;
  deleteByUserAndPost(userId: string, postId: string): Promise<void>;
  deleteByUserAndComment(userId: string, commentId: string): Promise<void>;
}

export const LIKE_REPOSITORY = 'LIKE_REPOSITORY';

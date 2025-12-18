/**
 * Interface do repositório de bookmarks (contrato)
 */

export interface Bookmark {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: Date;
}

export interface BookmarkRepository {
  create(data: Omit<Bookmark, 'createdAt'>): Promise<Bookmark>;
  findById(id: string): Promise<Bookmark | null>;
  findByUserAndPost(userId: string, postId: string): Promise<Bookmark | null>;
  findByUserAndComment(userId: string, commentId: string): Promise<Bookmark | null>;
  findByPost(postId: string): Promise<Bookmark[]>;
  findByComment(commentId: string): Promise<Bookmark[]>;
  findByUser(userId: string, options?: { limit?: number; offset?: number }): Promise<Bookmark[]>;
  delete(id: string): Promise<void>;
  deleteByUserAndPost(userId: string, postId: string): Promise<void>;
  deleteByUserAndComment(userId: string, commentId: string): Promise<void>;
}

export const BOOKMARK_REPOSITORY = 'BOOKMARK_REPOSITORY';

/**
 * Interface do repositório de posts (contrato)
 */

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId: string;
  categoryId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt?: Date;
  tags: string[];
  readTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostRepository {
  create(data: Omit<Post, 'createdAt' | 'updatedAt'>): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;
  findAll(options?: { status?: string; authorId?: string; categoryId?: string; limit?: number; offset?: number }): Promise<Post[]>;
  update(id: string, data: Partial<Post>): Promise<Post | null>;
  delete(id: string): Promise<void>;
  incrementViewCount(id: string): Promise<void>;
  incrementLikeCount(id: string): Promise<void>;
  decrementLikeCount(id: string): Promise<void>;
  incrementCommentCount(id: string): Promise<void>;
  decrementCommentCount(id: string): Promise<void>;
}

export const POST_REPOSITORY = 'POST_REPOSITORY';

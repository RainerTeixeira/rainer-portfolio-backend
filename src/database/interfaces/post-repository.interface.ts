/**
 * Interface do repositório de posts (contrato)
 */

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: any; // JSON content from editor
  authorId: string;
  subcategoryId: string; // Posts belong to subcategories
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED' | 'TRASH';
  featured?: boolean;
  allowComments?: boolean;
  pinned?: boolean;
  priority?: number;
  publishedAt?: Date;
  views?: number;
  likesCount?: number;
  commentsCount?: number;
  bookmarksCount?: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields for compatibility
  excerpt?: string;
  coverImage?: string;
  categoryId?: string; // For backward compatibility
  tags?: string[];
  readTime?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  isFeatured?: boolean;
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

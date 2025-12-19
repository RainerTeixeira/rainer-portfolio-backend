import { Injectable } from '@nestjs/common';
import { Post, PostRepository } from '../interfaces/post-repository.interface';
import { DynamoDBService } from './dynamodb.service';

// Interface interna para incluir chaves do DynamoDB
interface PostWithKeys extends Post {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
}

@Injectable()
export class DynamoPostRepository implements PostRepository {
  private readonly tableName = 'portfolio-backend-table-posts';
  
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Post, 'createdAt' | 'updatedAt'>): Promise<Post> {
    const now = new Date();
    const item: Post = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put({
      ...item,
    }, this.tableName);

    return item;
  }

  async findById(id: string): Promise<Post | null> {
    const result = await this.dynamo.get({ id }, this.tableName);
    if (!result) return null;
    return result as Post;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const posts = await this.findAll();
    return posts.find(p => p.slug === slug) || null;
  }

  async findAll(options: {
    status?: string;
    authorId?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Post[]> {
    try {
      let posts = await this.dynamo.scan({}, this.tableName) as Post[];

      if (options.status) {
        posts = posts.filter(p => p.status === options.status);
      }
      if (options.authorId) {
        posts = posts.filter(p => p.authorId === options.authorId);
      }
      if (options.categoryId) {
        posts = posts.filter(p => p.subcategoryId === options.categoryId);
      }

      if (options.offset) {
        posts = posts.slice(options.offset);
      }
      if (options.limit) {
        posts = posts.slice(0, options.limit);
      }

      return posts;
    } catch (error) {
      console.error('Error scanning posts:', error);
      return [];
    }
  }

  async update(id: string, data: Partial<Post>): Promise<Post | null> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Post not found');

    const updated: Post = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    await this.dynamo.put({
      ...updated,
    }, this.tableName);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const post = await this.findById(id);
    if (post) {
      await this.dynamo.delete(id, '', this.tableName);
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { views: (post.views || 0) + 1 });
  }

  async incrementLikeCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { likesCount: (post.likesCount || 0) + 1 });
  }

  async decrementLikeCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { likesCount: Math.max(0, (post.likesCount || 0) - 1) });
  }

  async incrementCommentCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { commentsCount: (post.commentsCount || 0) + 1 });
  }

  async decrementCommentCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { commentsCount: Math.max(0, (post.commentsCount || 0) - 1) });
  }


}

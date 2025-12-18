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
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Post, 'createdAt' | 'updatedAt'>): Promise<Post> {
    const now = new Date();
    const item: Post = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put({
      PK: `POST#${item.id}`,
      SK: 'PROFILE',
      GSI1PK: `SLUG#${item.slug}`,
      GSI1SK: 'POST',
      GSI2PK: `AUTHOR#${item.authorId}`,
      GSI2SK: item.publishedAt?.toISOString() || item.createdAt.toISOString(),
      ...item,
    });

    return item;
  }

  async findById(id: string): Promise<Post | null> {
    const result = await this.dynamo.get({ PK: `POST#${id}`, SK: 'PROFILE' });

    if (!result) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...post } = result as unknown as PostWithKeys;
    return post as Post;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    // Implementação simplificada - em produção usaria GSI1
    const posts = await this.scanPosts();
    return posts.find(p => p.slug === slug) || null;
  }

  async findAll(options: {
    status?: string;
    authorId?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Post[]> {
    // Implementação simplificada - em produção usaria queries
    let posts = await this.scanPosts();

    if (options.status) {
      posts = posts.filter(p => p.status === options.status);
    }
    if (options.authorId) {
      posts = posts.filter(p => p.authorId === options.authorId);
    }
    if (options.categoryId) {
      posts = posts.filter(p => p.categoryId === options.categoryId);
    }

    if (options.offset) {
      posts = posts.slice(options.offset);
    }
    if (options.limit) {
      posts = posts.slice(0, options.limit);
    }

    return posts;
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
      PK: `POST#${updated.id}`,
      SK: 'PROFILE',
      GSI1PK: `SLUG#${updated.slug}`,
      GSI1SK: 'POST',
      GSI2PK: `AUTHOR#${updated.authorId}`,
      GSI2SK: updated.publishedAt?.toISOString() || updated.createdAt.toISOString(),
      ...updated,
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.dynamo.delete(`POST#${id}`, 'PROFILE');
  }

  async incrementViewCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { viewCount: post.viewCount + 1 });
  }

  async incrementLikeCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { likeCount: post.likeCount + 1 });
  }

  async decrementLikeCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { likeCount: Math.max(0, post.likeCount - 1) });
  }

  async incrementCommentCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { commentCount: post.commentCount + 1 });
  }

  async decrementCommentCount(id: string): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    
    await this.update(id, { commentCount: Math.max(0, post.commentCount - 1) });
  }

  private async scanPosts(): Promise<Post[]> {
    // Método auxiliar para scan de posts
    // Em produção, isso seria otimizado com queries
    return [];
  }
}

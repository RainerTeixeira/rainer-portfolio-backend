import { Injectable } from '@nestjs/common';
import { Comment, CommentRepository } from '../interfaces/comment-repository.interface';
import { DynamoDBService } from './dynamodb.service';

@Injectable()
export class DynamoCommentRepository implements CommentRepository {
  private readonly tableName = 'portfolio-backend-table-comments';
  
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Comment, 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const now = new Date();
    const item: Comment = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put(item, this.tableName);
    return item;
  }

  async findById(id: string): Promise<Comment | null> {
    const result = await this.dynamo.get({ id }, this.tableName);
    if (!result) return null;
    return result as Comment;
  }

  async findByPostId(postId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    let comments = await this.findAll();
    comments = comments.filter(c => c.postId === postId);

    if (options.offset) {
      comments = comments.slice(options.offset);
    }
    if (options.limit) {
      comments = comments.slice(0, options.limit);
    }

    return comments;
  }

  async findByAuthorId(authorId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    let comments = await this.findAll();
    comments = comments.filter(c => c.authorId === authorId);

    if (options.offset) {
      comments = comments.slice(options.offset);
    }
    if (options.limit) {
      comments = comments.slice(0, options.limit);
    }

    return comments;
  }

  async findReplies(parentId: string): Promise<Comment[]> {
    const comments = await this.findAll();
    return comments.filter(c => c.parentId === parentId);
  }

  async update(id: string, data: Partial<Comment>): Promise<Comment | null> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Comment not found');

    const updated: Comment = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    await this.dynamo.put(updated, this.tableName);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const comment = await this.findById(id);
    if (comment) {
      await this.dynamo.delete(id, '', this.tableName);
    }
  }

  async approve(id: string): Promise<void> {
    await this.update(id, { isApproved: true });
  }

  async reject(id: string): Promise<void> {
    await this.update(id, { isApproved: false });
  }

  private async findAll(): Promise<Comment[]> {
    try {
      const items = await this.dynamo.scan({}, this.tableName);
      return items as Comment[];
    } catch (error) {
      console.error('Error scanning comments:', error);
      return [];
    }
  }
}
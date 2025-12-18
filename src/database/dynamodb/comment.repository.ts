import { Injectable } from '@nestjs/common';
import { Comment, CommentRepository } from '../interfaces/comment-repository.interface';
import { DynamoDBService } from './dynamodb.service';

// Interface interna para incluir chaves do DynamoDB
interface CommentWithKeys extends Comment {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
}

@Injectable()
export class DynamoCommentRepository implements CommentRepository {
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Comment, 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const now = new Date();
    const item: Comment = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put({
      PK: `COMMENT#${item.id}`,
      SK: 'PROFILE',
      GSI1PK: `POST#${item.postId}`,
      GSI1SK: item.createdAt.toISOString(),
      GSI2PK: `AUTHOR#${item.authorId}`,
      GSI2SK: item.createdAt.toISOString(),
      ...item,
    });

    return item;
  }

  async findById(id: string): Promise<Comment | null> {
    const result = await this.dynamo.get({ PK: `COMMENT#${id}`, SK: 'PROFILE' });

    if (!result) return null;

    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...comment } = result as unknown as CommentWithKeys;
    return comment as Comment;
  }

  async findByPostId(postId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    // Implementação simplificada - em produção usaria GSI1
    let comments = await this.scanComments();
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
    // Implementação simplificada - em produção usaria GSI2
    let comments = await this.scanComments();
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
    // Implementação simplificada
    const comments = await this.scanComments();
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

    await this.dynamo.put({
      PK: `COMMENT#${updated.id}`,
      SK: 'PROFILE',
      GSI1PK: `POST#${updated.postId}`,
      GSI1SK: updated.createdAt.toISOString(),
      GSI2PK: `AUTHOR#${updated.authorId}`,
      GSI2SK: updated.createdAt.toISOString(),
      ...updated,
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.dynamo.delete(`COMMENT#${id}`, 'PROFILE');
  }

  async approve(id: string): Promise<void> {
    await this.update(id, { status: 'APPROVED' });
  }

  async reject(id: string): Promise<void> {
    await this.update(id, { status: 'REJECTED' });
  }

  private async scanComments(): Promise<Comment[]> {
    // Método auxiliar para scan de comentários
    // Em produção, isso seria otimizado com queries
    return [];
  }
}

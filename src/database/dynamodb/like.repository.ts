import { Injectable } from '@nestjs/common';
import { Like, LikeRepository } from '../interfaces/like-repository.interface';
import { DynamoDBService } from './dynamodb.service';

// Interface interna para incluir chaves do DynamoDB
interface LikeWithKeys extends Like {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
}

@Injectable()
export class DynamoLikeRepository implements LikeRepository {
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Like, 'createdAt'>): Promise<Like> {
    const now = new Date();
    const item: Like = {
      ...data,
      createdAt: now,
    };

    await this.dynamo.put({
      PK: `LIKE#${item.id}`,
      SK: 'PROFILE',
      GSI1PK: `USER#${item.userId}`,
      GSI1SK: item.createdAt.toISOString(),
      GSI2PK: item.postId ? `POST#${item.postId}` : `COMMENT#${item.commentId}`,
      GSI2SK: `USER#${item.userId}`,
      ...item,
    });

    return item;
  }

  async findById(id: string): Promise<Like | null> {
    const result = await this.dynamo.get({ PK: `LIKE#${id}`, SK: 'PROFILE' });

    if (!result) return null;

    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...like } = result as unknown as LikeWithKeys;
    return like as Like;
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Like | null> {
    // Implementação simplificada - em produção usaria GSI2
    const likes = await this.scanLikes();
    return likes.find(l => l.userId === userId && l.postId === postId) || null;
  }

  async findByUserAndComment(userId: string, commentId: string): Promise<Like | null> {
    // Implementação simplificada - em produção usaria GSI2
    const likes = await this.scanLikes();
    return likes.find(l => l.userId === userId && l.commentId === commentId) || null;
  }

  async findByPost(postId: string): Promise<Like[]> {
    // Implementação simplificada - em produção usaria GSI2
    const likes = await this.scanLikes();
    return likes.filter(l => l.postId === postId);
  }

  async findByComment(commentId: string): Promise<Like[]> {
    // Implementação simplificada - em produção usaria GSI2
    const likes = await this.scanLikes();
    return likes.filter(l => l.commentId === commentId);
  }

  async findByUser(userId: string): Promise<Like[]> {
    // Implementação simplificada - em produção usaria GSI1
    const likes = await this.scanLikes();
    return likes.filter(l => l.userId === userId);
  }

  async delete(id: string): Promise<void> {
    await this.dynamo.delete(`LIKE#${id}`, 'PROFILE');
  }

  async deleteByUserAndPost(userId: string, postId: string): Promise<void> {
    const like = await this.findByUserAndPost(userId, postId);
    if (like) {
      await this.delete(like.id);
    }
  }

  async deleteByUserAndComment(userId: string, commentId: string): Promise<void> {
    const like = await this.findByUserAndComment(userId, commentId);
    if (like) {
      await this.delete(like.id);
    }
  }

  private async scanLikes(): Promise<Like[]> {
    // Método auxiliar para scan de likes
    // Em produção, isso seria otimizado com queries
    return [];
  }
}

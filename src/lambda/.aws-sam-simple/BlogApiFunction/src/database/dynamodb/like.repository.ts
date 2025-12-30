import { Injectable } from '@nestjs/common';
import { Like, LikeRepository } from '../interfaces/like-repository.interface';
import { DynamoDBService } from './dynamodb.service';

@Injectable()
export class DynamoLikeRepository implements LikeRepository {
  private readonly tableName = 'portfolio-backend-table-likes';
  
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Like, 'createdAt'>): Promise<Like> {
    const now = new Date();
    const item: Like = {
      ...data,
      createdAt: now,
    };

    await this.dynamo.put(item, this.tableName);
    return item;
  }

  async findById(id: string): Promise<Like | null> {
    const result = await this.dynamo.get({ id }, this.tableName);
    if (!result) return null;
    return result as Like;
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Like | null> {
    const likes = await this.findAll();
    return likes.find(l => l.userId === userId && l.postId === postId) || null;
  }

  async findByPost(postId: string): Promise<Like[]> {
    const likes = await this.findAll();
    return likes.filter(l => l.postId === postId);
  }

  async findByUser(userId: string): Promise<Like[]> {
    const likes = await this.findAll();
    return likes.filter(l => l.userId === userId);
  }

  async delete(id: string): Promise<void> {
    const like = await this.findById(id);
    if (like) {
      await this.dynamo.delete(id, '', this.tableName);
    }
  }

  async deleteByUserAndPost(userId: string, postId: string): Promise<void> {
    const like = await this.findByUserAndPost(userId, postId);
    if (like) {
      await this.delete(like.id);
    }
  }

  async findByUserAndComment(userId: string, commentId: string): Promise<Like | null> {
    const likes = await this.findAll();
    return likes.find(l => l.userId === userId && l.commentId === commentId) || null;
  }

  async findByComment(commentId: string): Promise<Like[]> {
    const likes = await this.findAll();
    return likes.filter(l => l.commentId === commentId);
  }

  async deleteByUserAndComment(userId: string, commentId: string): Promise<void> {
    const like = await this.findByUserAndComment(userId, commentId);
    if (like) {
      await this.delete(like.id);
    }
  }

  private async findAll(): Promise<Like[]> {
    try {
      const items = await this.dynamo.scan({}, this.tableName);
      return items as unknown as Like[];
    } catch (error) {
      console.error('Error scanning likes:', error);
      return [];
    }
  }
}
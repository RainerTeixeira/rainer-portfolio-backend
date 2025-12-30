import { Injectable } from '@nestjs/common';
import { Like, LikeRepository } from '../interfaces/like-repository.interface';
import { MongoDBService } from './mongodb.service';
import { Collection, Filter } from 'mongodb';

@Injectable()
export class MongoLikeRepository implements LikeRepository {
  private collection: Collection<Like>;

  constructor(private readonly mongo: MongoDBService) {}

  private getCollection(): Collection<Like> {
    if (!this.collection) {
      this.collection = this.mongo.getCollection<Like>('likes');
    }
    return this.collection;
  }

  async create(data: Omit<Like, 'createdAt'>): Promise<Like> {
    const like: Like = {
      ...data,
      createdAt: new Date(),
    };

    await this.getCollection().insertOne(like);
    return like;
  }

  async findById(id: string): Promise<Like | null> {
    return await this.getCollection().findOne({ id });
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Like | null> {
    return await this.getCollection().findOne({ userId, postId });
  }

  async findByUserAndComment(userId: string, commentId: string): Promise<Like | null> {
    return await this.getCollection().findOne({ userId, commentId });
  }

  async findByPost(postId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Like[]> {
    const cursor = this.getCollection().find({ postId })
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async findByComment(commentId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Like[]> {
    const cursor = this.getCollection().find({ commentId })
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async findByUser(userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Like[]> {
    const cursor = this.getCollection().find({ userId })
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async findAll(options: {
    userId?: string;
    postId?: string;
    commentId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Like[]> {
    const filter: Filter<Like> = {};

    if (options.userId) {
      filter.userId = options.userId;
    }
    if (options.postId) {
      filter.postId = options.postId;
    }
    if (options.commentId) {
      filter.commentId = options.commentId;
    }

    const cursor = this.getCollection().find(filter)
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().deleteOne({ id });
  }

  async deleteByUserAndPost(userId: string, postId: string): Promise<void> {
    await this.getCollection().deleteOne({ userId, postId });
  }

  async deleteByUserAndComment(userId: string, commentId: string): Promise<void> {
    await this.getCollection().deleteOne({ userId, commentId });
  }

  async countByPost(postId: string): Promise<number> {
    return await this.getCollection().countDocuments({ postId });
  }

  async countByComment(commentId: string): Promise<number> {
    return await this.getCollection().countDocuments({ commentId });
  }

  async countByUser(userId: string): Promise<number> {
    return await this.getCollection().countDocuments({ userId });
  }
}

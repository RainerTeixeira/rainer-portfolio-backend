import { Injectable } from '@nestjs/common';
import { Bookmark, BookmarkRepository } from '../interfaces/bookmark-repository.interface';
import { MongoDBService } from './mongodb.service';
import { Collection } from 'mongodb';

@Injectable()
export class MongoBookmarkRepository implements BookmarkRepository {
  private collection: Collection<Bookmark>;

  constructor(private readonly mongo: MongoDBService) {}

  private getCollection(): Collection<Bookmark> {
    if (!this.collection) {
      this.collection = this.mongo.getCollection<Bookmark>('bookmarks');
    }
    return this.collection;
  }

  async create(data: Omit<Bookmark, 'createdAt'>): Promise<Bookmark> {
    const bookmark: Bookmark = {
      ...data,
      createdAt: new Date(),
    };

    await this.getCollection().insertOne(bookmark);
    return bookmark;
  }

  async findById(id: string): Promise<Bookmark | null> {
    return await this.getCollection().findOne({ id });
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Bookmark | null> {
    return await this.getCollection().findOne({ userId, postId });
  }

  async findByUserAndComment(userId: string, commentId: string): Promise<Bookmark | null> {
    return await this.getCollection().findOne({ userId, commentId });
  }

  async findByPost(postId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Bookmark[]> {
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
  } = {}): Promise<Bookmark[]> {
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
  } = {}): Promise<Bookmark[]> {
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

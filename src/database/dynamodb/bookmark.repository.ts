import { Injectable } from '@nestjs/common';
import { Bookmark, BookmarkRepository } from '../interfaces/bookmark-repository.interface';
import { DynamoDBService } from './dynamodb.service';

@Injectable()
export class DynamoBookmarkRepository implements BookmarkRepository {
  private readonly tableName = 'portfolio-backend-table-bookmarks';
  
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Bookmark, 'createdAt' | 'updatedAt'>): Promise<Bookmark> {
    const now = new Date();
    const item: Bookmark = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    await this.dynamo.put(item, this.tableName);
    return item;
  }

  async findById(id: string): Promise<Bookmark | null> {
    const result = await this.dynamo.get({ id }, this.tableName);
    if (!result) return null;
    return result as Bookmark;
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Bookmark | null> {
    const bookmarks = await this.findAll();
    return bookmarks.find(b => b.userId === userId && b.postId === postId) || null;
  }

  async findByPost(postId: string): Promise<Bookmark[]> {
    const bookmarks = await this.findAll();
    return bookmarks.filter(b => b.postId === postId);
  }

  async findByUser(userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Bookmark[]> {
    let bookmarks = await this.findAll();
    bookmarks = bookmarks.filter(b => b.userId === userId);

    if (options.offset) {
      bookmarks = bookmarks.slice(options.offset);
    }
    if (options.limit) {
      bookmarks = bookmarks.slice(0, options.limit);
    }

    return bookmarks;
  }

  async update(id: string, data: Partial<Bookmark>): Promise<Bookmark | null> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Bookmark not found');

    const updated: Bookmark = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    await this.dynamo.put(updated, this.tableName);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const bookmark = await this.findById(id);
    if (bookmark) {
      await this.dynamo.delete(id, '', this.tableName);
    }
  }

  async deleteByUserAndPost(userId: string, postId: string): Promise<void> {
    const bookmark = await this.findByUserAndPost(userId, postId);
    if (bookmark) {
      await this.delete(bookmark.id);
    }
  }

  private async findAll(): Promise<Bookmark[]> {
    try {
      const items = await this.dynamo.scan({}, this.tableName);
      return items as Bookmark[];
    } catch (error) {
      console.error('Error scanning bookmarks:', error);
      return [];
    }
  }
}
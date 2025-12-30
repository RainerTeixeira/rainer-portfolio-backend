import { Injectable } from '@nestjs/common';
import { Bookmark, BookmarkRepository } from '../interfaces/bookmark-repository.interface';
import { DynamoDBService } from './dynamodb.service';

@Injectable()
export class DynamoBookmarkRepository implements BookmarkRepository {
  private readonly tableName = 'portfolio-backend-table-bookmarks';
  
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Bookmark, 'createdAt'>): Promise<Bookmark> {
    const now = new Date();
    const item: Bookmark = {
      ...data,
      createdAt: now,
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

  async findByUserAndComment(userId: string, commentId: string): Promise<Bookmark | null> {
    const bookmarks = await this.findAll();
    return bookmarks.find(b => b.userId === userId && b.commentId === commentId) || null;
  }

  async findByComment(commentId: string): Promise<Bookmark[]> {
    const bookmarks = await this.findAll();
    return bookmarks.filter(b => b.commentId === commentId);
  }

  async deleteByUserAndComment(userId: string, commentId: string): Promise<void> {
    const bookmark = await this.findByUserAndComment(userId, commentId);
    if (bookmark) {
      await this.delete(bookmark.id);
    }
  }

  private async findAll(): Promise<Bookmark[]> {
    try {
      const items = await this.dynamo.scan({}, this.tableName);
      return items as unknown as Bookmark[];
    } catch (error) {
      console.error('Error scanning bookmarks:', error);
      return [];
    }
  }
}
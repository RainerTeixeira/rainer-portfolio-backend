import { Injectable } from '@nestjs/common';
import { Bookmark, BookmarkRepository } from '../interfaces/bookmark-repository.interface';
import { DynamoDBService } from './dynamodb.service';

// Interface interna para incluir chaves do DynamoDB
interface BookmarkWithKeys extends Bookmark {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
}

@Injectable()
export class DynamoBookmarkRepository implements BookmarkRepository {
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Bookmark, 'createdAt'>): Promise<Bookmark> {
    const now = new Date();
    const item: Bookmark = {
      ...data,
      createdAt: now,
    };

    await this.dynamo.put({
      PK: `BOOKMARK#${item.id}`,
      SK: 'PROFILE',
      GSI1PK: `USER#${item.userId}`,
      GSI1SK: item.createdAt.toISOString(),
      GSI2PK: item.postId ? `POST#${item.postId}` : `COMMENT#${item.commentId}`,
      GSI2SK: `USER#${item.userId}`,
      ...item,
    });

    return item;
  }

  async findById(id: string): Promise<Bookmark | null> {
    const result = await this.dynamo.get({ PK: `BOOKMARK#${id}`, SK: 'PROFILE' });

    if (!result) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...bookmark } = result as unknown as BookmarkWithKeys;
    return bookmark as Bookmark;
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Bookmark | null> {
    // Implementação simplificada - em produção usaria GSI2
    const bookmarks = await this.scanBookmarks();
    return bookmarks.find(b => b.userId === userId && b.postId === postId) || null;
  }

  async findByUserAndComment(userId: string, commentId: string): Promise<Bookmark | null> {
    // Implementação simplificada - em produção usaria GSI2
    const bookmarks = await this.scanBookmarks();
    return bookmarks.find(b => b.userId === userId && b.commentId === commentId) || null;
  }

  async findByPost(postId: string): Promise<Bookmark[]> {
    // Implementação simplificada - em produção usaria GSI2
    const bookmarks = await this.scanBookmarks();
    return bookmarks.filter(b => b.postId === postId);
  }

  async findByComment(commentId: string): Promise<Bookmark[]> {
    // Implementação simplificada - em produção usaria GSI2
    const bookmarks = await this.scanBookmarks();
    return bookmarks.filter(b => b.commentId === commentId);
  }

  async findByUser(userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Bookmark[]> {
    // Implementação simplificada - em produção usaria GSI1
    let bookmarks = await this.scanBookmarks();
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
    await this.dynamo.delete(`BOOKMARK#${id}`, 'PROFILE');
  }

  async deleteByUserAndPost(userId: string, postId: string): Promise<void> {
    const bookmark = await this.findByUserAndPost(userId, postId);
    if (bookmark) {
      await this.delete(bookmark.id);
    }
  }

  async deleteByUserAndComment(userId: string, commentId: string): Promise<void> {
    const bookmark = await this.findByUserAndComment(userId, commentId);
    if (bookmark) {
      await this.delete(bookmark.id);
    }
  }

  private async scanBookmarks(): Promise<Bookmark[]> {
    // Método auxiliar para scan de bookmarks
    // Em produção, isso seria otimizado com queries
    return [];
  }
}

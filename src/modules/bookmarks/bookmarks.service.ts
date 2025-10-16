import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BookmarksRepository } from './bookmarks.repository.js';
import type { CreateBookmarkData, UpdateBookmarkData } from './bookmark.model.js';

@Injectable()
export class BookmarksService {
  constructor(private readonly bookmarksRepository: BookmarksRepository) {}

  async createBookmark(data: CreateBookmarkData) {
    const existing = await this.bookmarksRepository.findByUserAndPost(data.userId, data.postId);
    if (existing) throw new ConflictException('Post já está nos favoritos');
    
    return await this.bookmarksRepository.create(data);
  }

  async getBookmarkById(id: string) {
    const bookmark = await this.bookmarksRepository.findById(id);
    if (!bookmark) throw new NotFoundException('Bookmark não encontrado');
    return bookmark;
  }

  async getBookmarksByUser(userId: string) {
    return await this.bookmarksRepository.findByUser(userId);
  }

  async getBookmarksByCollection(userId: string, collection: string) {
    return await this.bookmarksRepository.findByCollection(userId, collection);
  }

  async updateBookmark(id: string, data: UpdateBookmarkData) {
    await this.getBookmarkById(id);
    return await this.bookmarksRepository.update(id, data);
  }

  async deleteBookmark(id: string) {
    await this.getBookmarkById(id);
    await this.bookmarksRepository.delete(id);
    return { success: true };
  }

  async deleteByUserAndPost(userId: string, postId: string) {
    const bookmark = await this.bookmarksRepository.findByUserAndPost(userId, postId);
    if (!bookmark) throw new NotFoundException('Bookmark não encontrado');
    
    await this.bookmarksRepository.delete(bookmark.id);
    return { success: true };
  }
}


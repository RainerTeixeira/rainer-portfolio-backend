import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Bookmark, CreateBookmarkData, UpdateBookmarkData } from './bookmark.model.js';

@Injectable()
export class BookmarksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBookmarkData): Promise<Bookmark> {
    return await this.prisma.bookmark.create({ data: data as any }) as any;
  }

  async findById(id: string): Promise<Bookmark | null> {
    return await this.prisma.bookmark.findUnique({ where: { id } }) as any;
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Bookmark | null> {
    return await this.prisma.bookmark.findFirst({ where: { userId, postId } }) as any;
  }

  async findByUser(userId: string): Promise<Bookmark[]> {
    return await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async findByCollection(userId: string, collection: string): Promise<Bookmark[]> {
    return await this.prisma.bookmark.findMany({
      where: { userId, collection },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async update(id: string, data: UpdateBookmarkData): Promise<Bookmark> {
    return await this.prisma.bookmark.update({ where: { id }, data: data as any }) as any;
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.bookmark.delete({ where: { id } });
    return true;
  }
}


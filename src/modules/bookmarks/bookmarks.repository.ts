/**
 * Repositório de Bookmarks
 * 
 * Camada de acesso a dados para bookmarks.
 * 
 * @module modules/bookmarks/bookmarks.repository
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Bookmark, CreateBookmarkData, UpdateBookmarkData } from './bookmark.model.js';

/**
 * BookmarksRepository
 *
 * Camada de acesso a dados de bookmarks (Prisma).
 */
@Injectable()
export class BookmarksRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria bookmark. */
  async create(data: CreateBookmarkData): Promise<Bookmark> {
    return await this.prisma.bookmark.create({ data: data as any }) as any;
  }

  /** Retorna bookmark por ID. */
  async findById(id: string): Promise<Bookmark | null> {
    return await this.prisma.bookmark.findUnique({ where: { id } }) as any;
  }

  /** Retorna bookmark pelo par usuário/post. */
  async findByUserAndPost(userId: string, postId: string): Promise<Bookmark | null> {
    return await this.prisma.bookmark.findFirst({ where: { userId, postId } }) as any;
  }

  /** Lista bookmarks de um usuário (ordem: mais recentes primeiro). */
  async findByUser(userId: string): Promise<Bookmark[]> {
    return await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  /** Lista bookmarks de uma coleção do usuário. */
  async findByCollection(userId: string, collection: string): Promise<Bookmark[]> {
    return await this.prisma.bookmark.findMany({
      where: { userId, collection },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  /** Atualiza bookmark. */
  async update(id: string, data: UpdateBookmarkData): Promise<Bookmark> {
    return await this.prisma.bookmark.update({ 
      where: { id }, 
      data: {
        ...(data as any),
        updatedAt: new Date(), // Atualiza apenas quando há mudança real
      }
    }) as any;
  }

  /** Remove bookmark por ID. */
  async delete(id: string): Promise<boolean> {
    await this.prisma.bookmark.delete({ where: { id } });
    return true;
  }
}


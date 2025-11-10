/**
 * Repositório de Comentários
 * 
 * Camada de acesso a dados para comentários.
 * 
 * @module modules/comments/comments.repository
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Comment, CreateCommentData, UpdateCommentData } from './comment.model.js';

/**
 * CommentsRepository
 *
 * Camada de acesso a dados de comentários (Prisma).
 */
@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria comentário. */
  async create(data: CreateCommentData): Promise<Comment> {
    return await this.prisma.comment.create({ data: data as any }) as any;
  }

  /** Retorna comentário por ID. */
  async findById(id: string): Promise<Comment | null> {
    return await this.prisma.comment.findUnique({ where: { id } }) as any;
  }

  /** Lista comentários com paginação (ordem: mais recentes primeiro). */
  async findAll(options: { limit: number; skip: number }): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      take: options.limit,
      skip: options.skip,
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  /** Lista comentários de um post. */
  async findByPost(postId: string): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  /** Lista comentários de um autor. */
  async findByAuthor(authorId: string): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  /** Atualiza comentário. */
  async update(id: string, data: UpdateCommentData): Promise<Comment> {
    return await this.prisma.comment.update({ 
      where: { id }, 
      data: {
        ...(data as any),
        updatedAt: new Date(), // Atualiza apenas quando há mudança real
      }
    }) as any;
  }

  /** Remove comentário por ID. */
  async delete(id: string): Promise<boolean> {
    await this.prisma.comment.delete({ where: { id } });
    return true;
  }
}


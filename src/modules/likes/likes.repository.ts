/**
 * Repositório de Likes
 * 
 * Camada de acesso a dados para likes.
 * 
 * @module modules/likes/likes.repository
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Like, CreateLikeData } from './like.model.js';

/**
 * LikesRepository
 *
 * Camada de acesso a dados de likes (Prisma).
 */
@Injectable()
export class LikesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria like. */
  async create(data: CreateLikeData): Promise<Like> {
    return await this.prisma.like.create({ data: data as any }) as any;
  }

  /** Retorna like pelo par usuário/post. */
  async findByUserAndPost(userId: string, postId: string): Promise<Like | null> {
    return await this.prisma.like.findFirst({ where: { userId, postId } }) as any;
  }

  /** Lista likes de um post. */
  async findByPost(postId: string): Promise<Like[]> {
    return await this.prisma.like.findMany({ where: { postId } }) as any;
  }

  /** Lista likes de um usuário. */
  async findByUser(userId: string): Promise<Like[]> {
    return await this.prisma.like.findMany({ where: { userId } }) as any;
  }

  /** Remove like pelo par usuário/post. */
  async delete(userId: string, postId: string): Promise<boolean> {
    await this.prisma.like.deleteMany({ where: { userId, postId } });
    return true;
  }

  /** Conta likes de um post. */
  async count(postId: string): Promise<number> {
    return await this.prisma.like.count({ where: { postId } });
  }
}


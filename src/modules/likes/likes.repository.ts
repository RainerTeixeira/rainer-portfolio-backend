import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Like, CreateLikeData } from './like.model.js';

@Injectable()
export class LikesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLikeData): Promise<Like> {
    return await this.prisma.like.create({ data: data as any }) as any;
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Like | null> {
    return await this.prisma.like.findFirst({ where: { userId, postId } }) as any;
  }

  async findByPost(postId: string): Promise<Like[]> {
    return await this.prisma.like.findMany({ where: { postId } }) as any;
  }

  async findByUser(userId: string): Promise<Like[]> {
    return await this.prisma.like.findMany({ where: { userId } }) as any;
  }

  async delete(userId: string, postId: string): Promise<boolean> {
    await this.prisma.like.deleteMany({ where: { userId, postId } });
    return true;
  }

  async count(postId: string): Promise<number> {
    return await this.prisma.like.count({ where: { postId } });
  }
}


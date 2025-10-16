import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Comment, CreateCommentData, UpdateCommentData } from './comment.model.js';

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateCommentData): Promise<Comment> {
    return await this.prisma.comment.create({ data: data as any }) as any;
  }

  async findById(id: string): Promise<Comment | null> {
    return await this.prisma.comment.findUnique({ where: { id } }) as any;
  }

  async findByPost(postId: string): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async findByAuthor(authorId: string): Promise<Comment[]> {
    return await this.prisma.comment.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async update(id: string, data: UpdateCommentData): Promise<Comment> {
    return await this.prisma.comment.update({ where: { id }, data: data as any }) as any;
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.comment.delete({ where: { id } });
    return true;
  }
}


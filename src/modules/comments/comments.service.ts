import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentsRepository } from './comments.repository.js';
import type { CreateCommentData, UpdateCommentData } from './comment.model.js';

@Injectable()
export class CommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  async createComment(data: CreateCommentData) {
    return await this.commentsRepository.create(data);
  }

  async getCommentById(id: string) {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    return comment;
  }

  async getCommentsByPost(postId: string) {
    return await this.commentsRepository.findByPost(postId);
  }

  async getCommentsByAuthor(authorId: string) {
    return await this.commentsRepository.findByAuthor(authorId);
  }

  async updateComment(id: string, data: UpdateCommentData) {
    await this.getCommentById(id);
    return await this.commentsRepository.update(id, { ...data, isEdited: true });
  }

  async deleteComment(id: string) {
    await this.getCommentById(id);
    await this.commentsRepository.delete(id);
    return { success: true };
  }

  async approveComment(id: string) {
    return await this.commentsRepository.update(id, { isApproved: true });
  }

  async disapproveComment(id: string) {
    return await this.commentsRepository.update(id, { isApproved: false });
  }
}


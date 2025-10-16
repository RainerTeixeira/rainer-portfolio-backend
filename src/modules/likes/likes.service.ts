import { Injectable, ConflictException } from '@nestjs/common';
import { LikesRepository } from './likes.repository.js';
import type { CreateLikeData } from './like.model.js';

@Injectable()
export class LikesService {
  constructor(private readonly likesRepository: LikesRepository) {}

  async likePost(data: CreateLikeData) {
    const existing = await this.likesRepository.findByUserAndPost(data.userId, data.postId);
    if (existing) throw new ConflictException('Você já curtiu este post');
    
    return await this.likesRepository.create(data);
  }

  async unlikePost(userId: string, postId: string) {
    const existing = await this.likesRepository.findByUserAndPost(userId, postId);
    if (!existing) throw new ConflictException('Você não curtiu este post');
    
    await this.likesRepository.delete(userId, postId);
    return { success: true };
  }

  async getLikesByPost(postId: string) {
    return await this.likesRepository.findByPost(postId);
  }

  async getLikesByUser(userId: string) {
    return await this.likesRepository.findByUser(userId);
  }

  async getLikesCount(postId: string) {
    const count = await this.likesRepository.count(postId);
    return { postId, count };
  }

  async hasUserLiked(userId: string, postId: string) {
    const like = await this.likesRepository.findByUserAndPost(userId, postId);
    return { hasLiked: !!like };
  }
}


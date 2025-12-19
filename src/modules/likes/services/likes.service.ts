/**
 * @fileoverview Serviço de Likes (Curtidas)
 *
 * Serviço que coordena operações de curtidas para posts e comentários.
 *
 * Característica importante:
 * - Operações de "curtir" são **idempotentes**: se a curtida já existir, o service
 *   retorna o registro existente ao invés de criar uma nova.
 *
 * @module modules/likes/services/likes.service
 */

import { Inject, Injectable } from '@nestjs/common';
import { LIKE_REPOSITORY } from '../../../database/tokens';
import { LikeRepository } from '../../../database/interfaces/like-repository.interface';
import { CreateLikeDto } from '../dto/create-like.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LikesService {
  constructor(
    @Inject(LIKE_REPOSITORY)
    private readonly likesRepo: LikeRepository,
  ) {}

  /**
   * Curte um post para um usuário (idempotente).
   *
   * Por que isso é idempotente:
   * - Evita duplicidade em cenários de clique duplo, retry de rede ou concorrência.
   * - Simplifica o frontend: chamar “curtir” várias vezes não cria lixo.
   *
   * @param {CreateLikeDto} dto Dados do like.
   * @returns {Promise<unknown>} Like criado ou existente.
   */
  async likePost(dto: CreateLikeDto): Promise<unknown> {
    // Verifica se já existe
    const existing = await this.likesRepo.findByUserAndPost(dto.userId, dto.postId!);
    if (existing) {
      return existing;
    }

    const id = randomUUID();
    return this.likesRepo.create({
      id,
      userId: dto.userId,
      postId: dto.postId,
    });
  }

  /**
   * Curte um comentário para um usuário (idempotente).
   *
   * Mesmo racional do `likePost`: múltiplas chamadas devem resultar em um único registro.
   *
   * @param {CreateLikeDto} dto Dados do like.
   * @returns {Promise<unknown>} Like criado ou existente.
   */
  async likeComment(dto: CreateLikeDto): Promise<unknown> {
    // Verifica se já existe
    const existing = await this.likesRepo.findByUserAndComment(dto.userId, dto.commentId!);
    if (existing) {
      return existing;
    }

    const id = randomUUID();
    return this.likesRepo.create({
      id,
      userId: dto.userId,
      commentId: dto.commentId,
    });
  }

  /**
   * Remove a curtida de um post.
   *
   * @param {string} userId ID do usuário.
   * @param {string} postId ID do post.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async unlikePost(userId: string, postId: string): Promise<void> {
    await this.likesRepo.deleteByUserAndPost(userId, postId);
  }

  /**
   * Remove a curtida de um comentário.
   *
   * @param {string} userId ID do usuário.
   * @param {string} commentId ID do comentário.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async unlikeComment(userId: string, commentId: string): Promise<void> {
    await this.likesRepo.deleteByUserAndComment(userId, commentId);
  }

  /**
   * Busca um like por ID.
   *
   * @param {string} id ID do like.
   * @returns {Promise<unknown>} Like encontrado.
   */
  async getLikeById(id: string): Promise<unknown> {
    return this.likesRepo.findById(id);
  }

  /**
   * Lista likes de um post.
   *
   * @param {string} postId ID do post.
   * @returns {Promise<unknown>} Lista de likes.
   */
  async getPostLikes(postId: string): Promise<unknown> {
    return this.likesRepo.findByPost(postId);
  }

  /**
   * Lista likes de um comentário.
   *
   * @param {string} commentId ID do comentário.
   * @returns {Promise<unknown>} Lista de likes.
   */
  async getCommentLikes(commentId: string): Promise<unknown> {
    return this.likesRepo.findByComment(commentId);
  }

  /**
   * Lista likes realizados por um usuário.
   *
   * @param {string} userId ID do usuário.
   * @returns {Promise<unknown>} Lista de likes.
   */
  async getUserLikes(userId: string): Promise<unknown> {
    return this.likesRepo.findByUser(userId);
  }

  /**
   * Verifica se um usuário curtiu um post.
   *
   * @param {string} userId ID do usuário.
   * @param {string} postId ID do post.
   * @returns {Promise<boolean>} `true` se existe like.
   */
  async isPostLikedByUser(userId: string, postId: string): Promise<boolean> {
    const like = await this.likesRepo.findByUserAndPost(userId, postId);
    return !!like;
  }

  /**
   * Verifica se um usuário curtiu um comentário.
   *
   * @param {string} userId ID do usuário.
   * @param {string} commentId ID do comentário.
   * @returns {Promise<boolean>} `true` se existe like.
   */
  async isCommentLikedByUser(userId: string, commentId: string): Promise<boolean> {
    const like = await this.likesRepo.findByUserAndComment(userId, commentId);
    return !!like;
  }
}

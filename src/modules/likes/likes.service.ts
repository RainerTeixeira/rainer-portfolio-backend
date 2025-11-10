/**
 * Serviço de Likes
 *
 * Camada de lógica de negócio para curtidas em posts.
 * Garante integridade (evita duplicidade), consultas e contagem de likes.
 *
 * @module modules/likes/likes.service
 */
import { Injectable, ConflictException } from '@nestjs/common';
import { LikesRepository } from './likes.repository.js';
import type { CreateLikeData } from './like.model.js';

/**
 * LikesService
 *
 * Camada de regras de negócio para curtidas em posts. Centraliza operações
 * de criação, remoção, consulta e contagem de likes, garantindo integridade
 * (ex.: evitar duplicidade de curtidas) e respostas consistentes para a API.
 *
 * Convenções:
 * - Erros de duplicidade e inexistência são mapeados para ConflictException.
 * - Métodos retornam objetos simples ou coleções com estrutura previsível.
 *
 */
@Injectable()
export class LikesService {
  constructor(private readonly likesRepository: LikesRepository) {}

  /**
   * Cria uma curtida (like) para um post por um usuário.
   *
   * Regra: impede duplicidade verificando se já existe like do mesmo usuário
   * para o mesmo post; em caso positivo, lança ConflictException.
   *
   * @param data Dados para criação do like (`userId`, `postId`).
   * @returns Like criado no repositório.
   * @throws ConflictException quando o usuário já curtiu o post.
   */
  async likePost(data: CreateLikeData) {
    const existing = await this.likesRepository.findByUserAndPost(data.userId, data.postId);
    if (existing) throw new ConflictException('Você já curtiu este post');
    
    return await this.likesRepository.create(data);
  }

  /**
   * Remove a curtida (like) de um post para um usuário.
   *
   * Regra: exige que o like exista previamente; caso contrário, lança
   * ConflictException indicando que não havia like para remover.
   *
   * @param userId ID do usuário que curtiu.
   * @param postId ID do post curtido.
   * @returns Objeto de confirmação `{ success: true }`.
   * @throws ConflictException quando não existe like para o par usuário/post.
   */
  async unlikePost(userId: string, postId: string) {
    const existing = await this.likesRepository.findByUserAndPost(userId, postId);
    if (!existing) throw new ConflictException('Você não curtiu este post');
    
    await this.likesRepository.delete(userId, postId);
    return { success: true };
  }

  /**
   * Lista todas as curtidas de um post.
   *
   * @param postId ID do post alvo.
   * @returns Coleção de likes associados ao post.
   */
  async getLikesByPost(postId: string) {
    return await this.likesRepository.findByPost(postId);
  }

  /**
   * Lista todas as curtidas realizadas por um usuário.
   *
   * @param userId ID do usuário.
   * @returns Coleção de likes feitos pelo usuário.
   */
  async getLikesByUser(userId: string) {
    return await this.likesRepository.findByUser(userId);
  }

  /**
   * Retorna a contagem total de likes de um post.
   *
   * @param postId ID do post alvo.
   * @returns Objeto `{ postId, count }` com a contagem agregada.
   */
  async getLikesCount(postId: string) {
    const count = await this.likesRepository.count(postId);
    return { postId, count };
  }

  /**
   * Indica se um usuário já curtiu determinado post.
   *
   * @param userId ID do usuário.
   * @param postId ID do post.
   * @returns Objeto `{ hasLiked: boolean }`.
   */
  async hasUserLiked(userId: string, postId: string) {
    const like = await this.likesRepository.findByUserAndPost(userId, postId);
    return { hasLiked: !!like };
  }
}


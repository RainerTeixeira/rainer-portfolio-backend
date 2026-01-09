/**
 * @fileoverview Serviço de Comentários
 *
 * Camada de serviço responsável por coordenar operações de comentários:
 * criação, listagem, atualização, remoção e moderação (aprovar/rejeitar).
 *
 * Regras/decisões aplicadas aqui (alto nível):
 * - Geração de `id` para novos comentários.
 * - Definição de status padrão como `PENDING` quando não informado.
 * - Delegação do acesso a dados ao `CommentRepository`.
 *
 * @module modules/comments/services/comments.service
 */

import { Inject, Injectable } from '@nestjs/common';
import { COMMENT_REPOSITORY } from '../../../database/tokens';
import { CommentRepository } from '../../../database/interfaces/comment-repository.interface';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CommentsService {
  constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly commentsRepo: CommentRepository,
  ) {}

  /**
   * Cria um novo comentário.
   *
   * @param {CreateCommentDto} dto Dados do comentário.
   * @returns {Promise<unknown>} Comentário criado.
   */
  async createComment(dto: CreateCommentDto) {
    const id = randomUUID();

    return this.commentsRepo.create({
      id,
      content: dto.content,
      authorId: dto.authorId,
      postId: dto.postId,
      parentId: dto.parentId,
      status: dto.status || 'PENDING',
    });
  }

  /**
   * Busca um comentário por ID.
   *
   * @param {string} id ID do comentário.
   * @returns {Promise<unknown>} Comentário encontrado.
   */
  async getCommentById(id: string) {
    return this.commentsRepo.findById(id);
  }

  /**
   * Lista comentários de um post.
   *
   * @param {string} postId ID do post.
   * @param {object} [options] Opções de paginação.
   * @returns {Promise<unknown>} Comentários encontrados.
   */
  async getCommentsByPostId(postId: string, options?: {
    limit?: number;
    offset?: number;
  }) {
    return this.commentsRepo.findByPostId(postId, options);
  }

  /**
   * Lista comentários criados por um autor.
   *
   * @param {string} authorId ID do autor.
   * @param {object} [options] Opções de paginação.
   * @returns {Promise<unknown>} Comentários encontrados.
   */
  async getCommentsByAuthorId(authorId: string, options?: {
    limit?: number;
    offset?: number;
  }) {
    return this.commentsRepo.findByAuthorId(authorId, options);
  }

  /**
   * Lista respostas (replies) de um comentário pai.
   *
   * @param {string} parentId ID do comentário pai.
   * @returns {Promise<unknown>} Respostas encontradas.
   */
  async getReplies(parentId: string) {
    return this.commentsRepo.findReplies(parentId);
  }

  /**
   * Atualiza um comentário.
   *
   * @param {string} id ID do comentário.
   * @param {UpdateCommentDto} dto Campos para atualização.
   * @returns {Promise<unknown>} Comentário atualizado.
   */
  async updateComment(id: string, dto: UpdateCommentDto) {
    return this.commentsRepo.update(id, dto);
  }

  /**
   * Remove um comentário.
   *
   * @param {string} id ID do comentário.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async deleteComment(id: string) {
    await this.commentsRepo.delete(id);
  }

  /**
   * Aprova um comentário.
   *
   * @param {string} id ID do comentário.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async approveComment(id: string) {
    await this.commentsRepo.approve(id);
  }

  /**
   * Rejeita um comentário.
   *
   * @param {string} id ID do comentário.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async rejectComment(id: string) {
    await this.commentsRepo.reject(id);
  }
}

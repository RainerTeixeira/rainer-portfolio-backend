/**
 * Serviço de Comentários
 *
 * Camada de lógica de negócio para comentários.
 * Implementa CRUD, moderação e consultas por post e autor.
 *
 * @module modules/comments/comments.service
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentsRepository } from './comments.repository.js';
import type { CreateCommentData, UpdateCommentData } from './comment.model.js';

/**
 * CommentsService
 *
 * Camada de regras de negócio para comentários. Implementa operações de
 * criação, listagem, atualização, remoção e moderação (aprovar/reprovar),
 * além de consultas por post e por autor.
 *
 * Convenções:
 * - Lança NotFoundException quando o recurso não existe.
 * - Marca `isEdited` em atualizações de conteúdo.
 *
 */
@Injectable()
export class CommentsService {
  constructor(private readonly commentsRepository: CommentsRepository) {}

  /**
   * Cria um novo comentário.
   *
   * @param data Dados do comentário (autor, post, conteúdo, etc.).
   * @returns Comentário criado.
   */
  async createComment(data: CreateCommentData) {
    return await this.commentsRepository.create(data);
  }

  /**
   * Lista comentários com paginação simples.
   *
   * @param options Parâmetros de paginação (`limit`, `page`).
   * @returns Lista paginada de comentários.
   */
  async listComments(options?: { limit?: number; page?: number }) {
    const limit = options?.limit ? Number(options.limit) : 10;
    const page = options?.page ? Number(options.page) : 1;
    const skip = (page - 1) * limit;
    
    return await this.commentsRepository.findAll({ limit, skip });
  }

  /**
   * Retorna um comentário por ID.
   *
   * @param id ID do comentário.
   * @returns Comentário encontrado.
   * @throws NotFoundException se não existir.
   */
  async getCommentById(id: string) {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    return comment;
  }

  /**
   * Lista comentários de um post.
   *
   * @param postId ID do post.
   * @returns Coleção de comentários do post.
   */
  async getCommentsByPost(postId: string) {
    return await this.commentsRepository.findByPost(postId);
  }

  /**
   * Lista comentários de um autor específico.
   *
   * @param authorId ID do autor.
   * @returns Coleção de comentários do autor.
   */
  async getCommentsByAuthor(authorId: string) {
    return await this.commentsRepository.findByAuthor(authorId);
  }

  /**
   * Atualiza um comentário e marca o flag `isEdited`.
   *
   * @param id ID do comentário.
   * @param data Dados a atualizar.
   * @returns Comentário atualizado.
   */
  async updateComment(id: string, data: UpdateCommentData) {
    await this.getCommentById(id);
    return await this.commentsRepository.update(id, { ...data, isEdited: true });
  }

  /**
   * Remove um comentário por ID.
   *
   * @param id ID do comentário.
   * @returns Objeto `{ success: true }` em caso de sucesso.
   */
  async deleteComment(id: string) {
    await this.getCommentById(id);
    await this.commentsRepository.delete(id);
    return { success: true };
  }

  /**
   * Marca um comentário como aprovado.
   *
   * @param id ID do comentário.
   * @returns Comentário com `isApproved: true`.
   */
  async approveComment(id: string) {
    return await this.commentsRepository.update(id, { isApproved: true });
  }

  /**
   * Marca um comentário como reprovado.
   *
   * @param id ID do comentário.
   * @returns Comentário com `isApproved: false`.
   */
  async disapproveComment(id: string) {
    return await this.commentsRepository.update(id, { isApproved: false });
  }
}


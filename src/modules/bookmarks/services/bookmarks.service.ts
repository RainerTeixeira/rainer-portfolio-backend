/**
 * @fileoverview Serviço de Bookmarks (Favoritos)
 *
 * Serviço responsável por coordenar operações de favoritos para posts e comentários.
 *
 * Característica importante:
 * - Operações de "favoritar" são **idempotentes**: se o favorito já existir, o service
 *   retorna o registro existente ao invés de criar um novo.
 *
 * @module modules/bookmarks/services/bookmarks.service
 */

import { Inject, Injectable } from '@nestjs/common';
import { BOOKMARK_REPOSITORY } from '../../../database/tokens';
import { BookmarkRepository } from '../../../database/interfaces/bookmark-repository.interface';
import { CreateBookmarkDto } from '../dto/create-bookmark.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BookmarksService {
  constructor(
    @Inject(BOOKMARK_REPOSITORY)
    private readonly bookmarksRepo: BookmarkRepository,
  ) {}

  /**
   * Cria (ou retorna) o bookmark de um post para um usuário.
   *
   * @param {CreateBookmarkDto} dto Dados do bookmark.
   * @returns {Promise<unknown>} Bookmark criado ou já existente.
   */
  async bookmarkPost(dto: CreateBookmarkDto) {
    // Verifica se já existe
    const existing = await this.bookmarksRepo.findByUserAndPost(dto.userId, dto.postId!);
    if (existing) {
      return existing;
    }

    const id = randomUUID();
    return this.bookmarksRepo.create({
      id,
      userId: dto.userId,
      postId: dto.postId,
    });
  }

  /**
   * Cria (ou retorna) o bookmark de um comentário para um usuário.
   *
   * @param {CreateBookmarkDto} dto Dados do bookmark.
   * @returns {Promise<unknown>} Bookmark criado ou já existente.
   */
  async bookmarkComment(dto: CreateBookmarkDto) {
    // Verifica se já existe
    const existing = await this.bookmarksRepo.findByUserAndComment(dto.userId, dto.commentId!);
    if (existing) {
      return existing;
    }

    const id = randomUUID();
    return this.bookmarksRepo.create({
      id,
      userId: dto.userId,
      commentId: dto.commentId,
    });
  }

  /**
   * Remove bookmark de post para um usuário.
   *
   * @param {string} userId ID do usuário.
   * @param {string} postId ID do post.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async unbookmarkPost(userId: string, postId: string) {
    await this.bookmarksRepo.deleteByUserAndPost(userId, postId);
  }

  /**
   * Remove bookmark de comentário para um usuário.
   *
   * @param {string} userId ID do usuário.
   * @param {string} commentId ID do comentário.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async unbookmarkComment(userId: string, commentId: string) {
    await this.bookmarksRepo.deleteByUserAndComment(userId, commentId);
  }

  /**
   * Busca um bookmark por ID.
   *
   * @param {string} id ID do bookmark.
   * @returns {Promise<unknown>} Bookmark encontrado.
   */
  async getBookmarkById(id: string) {
    return this.bookmarksRepo.findById(id);
  }

  /**
   * Lista bookmarks de um post.
   *
   * @param {string} postId ID do post.
   * @returns {Promise<unknown>} Lista de bookmarks.
   */
  async getPostBookmarks(postId: string) {
    return this.bookmarksRepo.findByPost(postId);
  }

  /**
   * Lista bookmarks de um comentário.
   *
   * @param {string} commentId ID do comentário.
   * @returns {Promise<unknown>} Lista de bookmarks.
   */
  async getCommentBookmarks(commentId: string) {
    return this.bookmarksRepo.findByComment(commentId);
  }

  /**
   * Lista bookmarks de um usuário, com suporte a paginação.
   *
   * @param {string} userId ID do usuário.
   * @param {object} [options] Opções de paginação.
   * @returns {Promise<unknown>} Lista de bookmarks.
   */
  async getUserBookmarks(userId: string, options?: {
    limit?: number;
    offset?: number;
  }) {
    return this.bookmarksRepo.findByUser(userId, options);
  }

  /**
   * Verifica se um usuário favoritou um post.
   *
   * @param {string} userId ID do usuário.
   * @param {string} postId ID do post.
   * @returns {Promise<boolean>} `true` se existe bookmark.
   */
  async isPostBookmarkedByUser(userId: string, postId: string) {
    const bookmark = await this.bookmarksRepo.findByUserAndPost(userId, postId);
    return !!bookmark;
  }

  /**
   * Verifica se um usuário favoritou um comentário.
   *
   * @param {string} userId ID do usuário.
   * @param {string} commentId ID do comentário.
   * @returns {Promise<boolean>} `true` se existe bookmark.
   */
  async isCommentBookmarkedByUser(userId: string, commentId: string) {
    const bookmark = await this.bookmarksRepo.findByUserAndComment(userId, commentId);
    return !!bookmark;
  }
}

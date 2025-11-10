import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { BookmarksRepository } from './bookmarks.repository.js';
import type { CreateBookmarkData, UpdateBookmarkData } from './bookmark.model.js';

/**
 * BookmarksService
 *
 * Camada de regras de negócio para favoritos (bookmarks) de posts. Implementa
 * criação, listagem, atualização e remoção, garantindo consistência de dados
 * (ex.: impedir duplicidade por par usuário/post).
 *
 * Convenções:
 * - Lança ConflictException em duplicidade e NotFoundException quando o
 *   recurso alvo não existe.
 *
 */
@Injectable()
export class BookmarksService {
  constructor(private readonly bookmarksRepository: BookmarksRepository) {}

  /**
   * Cria um bookmark para um par usuário/post.
   *
   * @param data Dados do bookmark (`userId`, `postId`, `collection` opcional).
   * @returns Bookmark criado.
   * @throws ConflictException quando já existe bookmark para o par.
   */
  async createBookmark(data: CreateBookmarkData) {
    const existing = await this.bookmarksRepository.findByUserAndPost(data.userId, data.postId);
    if (existing) throw new ConflictException('Post já está nos favoritos');
    
    return await this.bookmarksRepository.create(data);
  }

  /**
   * Retorna um bookmark por ID.
   *
   * @param id ID do bookmark.
   * @returns Bookmark encontrado.
   * @throws NotFoundException se não existir.
   */
  async getBookmarkById(id: string) {
    const bookmark = await this.bookmarksRepository.findById(id);
    if (!bookmark) throw new NotFoundException('Bookmark não encontrado');
    return bookmark;
  }

  /**
   * Lista bookmarks de um usuário.
   *
   * @param userId ID do usuário.
   * @returns Coleção de bookmarks do usuário.
   */
  async getBookmarksByUser(userId: string) {
    return await this.bookmarksRepository.findByUser(userId);
  }

  /**
   * Lista bookmarks de uma coleção do usuário.
   *
   * @param userId ID do usuário.
   * @param collection Nome da coleção.
   * @returns Coleção de bookmarks da coleção.
   */
  async getBookmarksByCollection(userId: string, collection: string) {
    return await this.bookmarksRepository.findByCollection(userId, collection);
  }

  /**
   * Atualiza atributos de um bookmark.
   *
   * @param id ID do bookmark.
   * @param data Dados a atualizar.
   * @returns Bookmark atualizado.
   */
  async updateBookmark(id: string, data: UpdateBookmarkData) {
    await this.getBookmarkById(id);
    return await this.bookmarksRepository.update(id, data);
  }

  /**
   * Remove um bookmark por ID.
   *
   * @param id ID do bookmark.
   * @returns Objeto `{ success: true }` em caso de sucesso.
   */
  async deleteBookmark(id: string) {
    await this.getBookmarkById(id);
    await this.bookmarksRepository.delete(id);
    return { success: true };
  }

  /**
   * Remove um bookmark localizando pelo par usuário/post.
   *
   * @param userId ID do usuário.
   * @param postId ID do post.
   * @returns Objeto `{ success: true }` em caso de sucesso.
   * @throws NotFoundException quando não há bookmark para o par.
   */
  async deleteByUserAndPost(userId: string, postId: string) {
    const bookmark = await this.bookmarksRepository.findByUserAndPost(userId, postId);
    if (!bookmark) throw new NotFoundException('Bookmark não encontrado');
    
    await this.bookmarksRepository.delete(bookmark.id);
    return { success: true };
  }
}


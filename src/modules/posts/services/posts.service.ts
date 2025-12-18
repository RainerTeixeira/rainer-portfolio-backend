/**
 * @fileoverview Serviço de Posts
 *
 * Camada de serviço responsável por orquestrar operações relacionadas a posts.
 *
 * Responsabilidades típicas:
 * - Gerar identificadores (ex.: `randomUUID`) quando necessário.
 * - Definir valores padrão (ex.: status `DRAFT`).
 * - Delegar persistência e consultas ao `PostRepository`.
 *
 * Observações:
 * - A regra de persistência/consulta fica no repositório (MongoDB/DynamoDB).
 * - Este service tende a ser fino (thin service), apenas coordenando chamadas.
 *
 * @module modules/posts/services/posts.service
 */

import { Inject, Injectable } from '@nestjs/common';
import { POST_REPOSITORY } from '../../../database/tokens';
import { PostRepository } from '../../../database/interfaces/post-repository.interface';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { randomUUID } from 'crypto';
import { textToSlug } from '../../../utils/slug';

@Injectable()
export class PostsService {
  constructor(
    @Inject(POST_REPOSITORY)
    private readonly postsRepo: PostRepository,
  ) {}

  /**
   * Cria um novo post.
   *
   * Regras/decisões aplicadas aqui:
   * - Gera um `id` único.
   * - Define defaults para `status`, contadores e flags.
   *
   * @param {CreatePostDto} dto Dados de criação.
   * @returns {Promise<unknown>} Entidade criada (conforme implementação do repositório).
   */
  async createPost(dto: CreatePostDto) {
    const id = randomUUID();
    const slug = dto.slug || textToSlug(dto.title);

    return this.postsRepo.create({
      id,
      title: dto.title,
      slug,
      content: dto.content,
      excerpt: dto.excerpt,
      coverImage: dto.coverImage,
      authorId: dto.authorId,
      categoryId: dto.categoryId,
      status: dto.status || 'DRAFT',
      publishedAt: dto.publishedAt,
      tags: dto.tags || [],
      readTime: dto.readTime || 0,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      isFeatured: dto.isFeatured || false,
    });
  }

  /**
   * Busca um post por ID.
   *
   * @param {string} id ID do post.
   * @returns {Promise<unknown>} Post encontrado ou `null`/`undefined` dependendo do repositório.
   */
  async getPostById(id: string) {
    return this.postsRepo.findById(id);
  }

  /**
   * Busca um post por slug.
   *
   * @param {string} slug Slug do post.
   * @returns {Promise<unknown>} Post encontrado ou `null`/`undefined` dependendo do repositório.
   */
  async getPostBySlug(slug: string) {
    return this.postsRepo.findBySlug(slug);
  }

  /**
   * Lista posts com filtros/paginação.
   *
   * @param {object} [options] Opções de filtro e paginação.
   * @returns {Promise<unknown>} Resultado conforme implementação do repositório.
   */
  async getAllPosts(options?: {
    status?: string;
    authorId?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.postsRepo.findAll(options);
  }

  /**
   * Atualiza dados de um post.
   *
   * @param {string} id ID do post.
   * @param {UpdatePostDto} dto Campos a atualizar.
   * @returns {Promise<unknown>} Post atualizado.
   */
  async updatePost(id: string, dto: UpdatePostDto) {
    return this.postsRepo.update(id, dto);
  }

  /**
   * Remove um post.
   *
   * @param {string} id ID do post.
   * @returns {Promise<void>} Conclusão da remoção.
   */
  async deletePost(id: string) {
    await this.postsRepo.delete(id);
  }

  /**
   * Incrementa o contador de visualizações de um post.
   *
   * @param {string} id ID do post.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async incrementViewCount(id: string) {
    await this.postsRepo.incrementViewCount(id);
  }

  /**
   * Publica um post.
   *
   * Efeitos:
   * - Define `status` como `PUBLISHED`.
   * - Define `publishedAt` com a data/hora atual.
   *
   * @param {string} id ID do post.
   * @returns {Promise<unknown>} Post atualizado.
   */
  async publishPost(id: string) {
    return this.postsRepo.update(id, {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    });
  }

  /**
   * Arquiva um post.
   *
   * @param {string} id ID do post.
   * @returns {Promise<unknown>} Post atualizado.
   */
  async archivePost(id: string) {
    return this.postsRepo.update(id, {
      status: 'ARCHIVED',
    });
  }
}

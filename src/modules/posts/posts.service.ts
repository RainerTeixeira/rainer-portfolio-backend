/**
 * Posts Service
 * 
 * Camada de lógica de negócio para posts.
 * Implementa validações e regras de negócio.
 * 
 * @module modules/posts/posts.service
 */

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PostsRepository } from './posts.repository.js';
import type { CreatePostData, UpdatePostData } from './post.model.js';
import { PostStatus } from './post.model.js';

/**
 * Serviço de Posts
 * Orquestra regras de negócio e valida dados
 */
@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(private readonly postsRepository: PostsRepository) {}

  /**
   * Cria um novo post
   * 
   * @param data - Dados do post a ser criado
   * @returns Post criado
   * @throws BadRequestException se dados inválidos
   */
  async createPost(data: CreatePostData) {
    this.logger.log(`Creating post: ${data.title}`);
    
    // Validação de conteúdo
    if (!data.content) {
      throw new BadRequestException('Conteúdo do post é obrigatório');
    }

    // Validação de subcategoria
    if (!data.subcategoryId) {
      throw new BadRequestException('Subcategoria é obrigatória');
    }

    // Validação de autor
    if (!data.authorId) {
      throw new BadRequestException('Autor é obrigatório');
    }

    return await this.postsRepository.create(data);
  }

  /**
   * Busca post por ID e incrementa views
   * 
   * @param id - ID do post
   * @returns Post encontrado
   * @throws NotFoundException se post não existir
   */
  async getPostById(id: string) {
    this.logger.log(`Getting post: ${id}`);
    
    const post = await this.postsRepository.findById(id);
    
    if (!post) {
      throw new NotFoundException(`Post com ID ${id} não encontrado`);
    }

    // Incrementa views de forma assíncrona (não bloqueia resposta)
    this.postsRepository.incrementViews(id).catch(err => {
      this.logger.error(`Erro ao incrementar views do post ${id}:`, err);
    });

    return post;
  }

  /**
   * Busca post por slug
   * 
   * @param slug - Slug do post
   * @returns Post encontrado
   * @throws NotFoundException se post não existir
   */
  async getPostBySlug(slug: string) {
    this.logger.log(`Getting post by slug: ${slug}`);
    
    const post = await this.postsRepository.findBySlug(slug);
    
    if (!post) {
      throw new NotFoundException(`Post com slug "${slug}" não encontrado`);
    }

    return post;
  }

  /**
   * Lista posts com filtros e paginação
   * 
   * @param params - Parâmetros de busca
   * @returns Posts paginados
   */
  async listPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    subcategoryId?: string;
    authorId?: string;
    featured?: boolean;
  }) {
    this.logger.log(`Listing posts with filters: ${JSON.stringify(params)}`);
    
    return await this.postsRepository.findMany(params || {});
  }

  /**
   * Atualiza um post
   * 
   * @param id - ID do post
   * @param data - Dados para atualizar
   * @returns Post atualizado
   * @throws NotFoundException se post não existir
   */
  async updatePost(id: string, data: UpdatePostData) {
    this.logger.log(`Updating post: ${id}`);
    
    // Verifica se post existe
    await this.getPostById(id);

    return await this.postsRepository.update(id, data);
  }

  /**
   * Deleta um post
   * 
   * @param id - ID do post
   * @returns Confirmação de deleção
   * @throws NotFoundException se post não existir
   */
  async deletePost(id: string) {
    this.logger.log(`Deleting post: ${id}`);
    
    // Verifica se post existe
    await this.getPostById(id);

    await this.postsRepository.delete(id);
    return { success: true, message: 'Post deletado com sucesso' };
  }

  /**
   * Publica um post (muda status para PUBLISHED)
   * 
   * @param id - ID do post
   * @returns Post publicado
   * @throws NotFoundException se post não existir
   */
  async publishPost(id: string) {
    this.logger.log(`Publishing post: ${id}`);
    
    return await this.postsRepository.update(id, {
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }

  /**
   * Despublica um post (muda status para DRAFT)
   * 
   * @param id - ID do post
   * @returns Post despublicado
   */
  async unpublishPost(id: string) {
    this.logger.log(`Unpublishing post: ${id}`);
    
    return await this.postsRepository.update(id, {
      status: PostStatus.DRAFT,
      publishedAt: null,
    });
  }

  /**
   * Lista posts de uma subcategoria
   * 
   * @param subcategoryId - ID da subcategoria
   * @returns Posts da subcategoria
   */
  async getPostsBySubcategory(subcategoryId: string) {
    this.logger.log(`Getting posts by subcategory: ${subcategoryId}`);
    
    return await this.postsRepository.findBySubcategory(subcategoryId);
  }

  /**
   * Lista posts de um autor
   * 
   * @param authorId - ID do autor
   * @returns Posts do autor
   */
  async getPostsByAuthor(authorId: string) {
    this.logger.log(`Getting posts by author: ${authorId}`);
    
    return await this.postsRepository.findByAuthor(authorId);
  }
}

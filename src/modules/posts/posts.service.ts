/**
 * Serviço de Posts
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
/**
 * PostsService
 *
 * Orquestra regras de negócio de posts (CRUD, publicação, consultas, métricas).
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
  /**
   * Cria um novo post com validações de conteúdo, subcategoria e autor.
   *
   * @param data Dados do post (título, `content`, `subcategoryId`, `authorId`, etc.).
   * @returns Post criado.
   * @throws BadRequestException quando dados obrigatórios estão ausentes.
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
  /**
   * Busca post por ID e incrementa views de forma assíncrona.
   *
   * Incremento de views não bloqueia a resposta e é tratado com logging.
   *
   * @param id ID do post.
   * @returns Post encontrado.
   * @throws NotFoundException quando o post não existe.
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
  /**
   * Busca post por slug.
   *
   * @param slug Slug do post.
   * @returns Post encontrado.
   * @throws NotFoundException quando não existe post com o slug informado.
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
  /**
   * Lista posts com filtros e paginação.
   *
   * Parâmetros aceitos: `page`, `limit`, `status`, `subcategoryId`, `authorId`,
   * `featured`.
   *
   * @param params Filtros e paginação.
   * @returns Coleção paginada de posts.
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
  /**
   * Atualiza um post existente (verifica existência previamente).
   *
   * @param id ID do post.
   * @param data Campos a atualizar.
   * @returns Post atualizado.
   * @throws NotFoundException quando o post não existe.
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
  /**
   * Deleta um post (verifica existência previamente).
   *
   * @param id ID do post.
   * @returns Objeto `{ success: true, message }` de confirmação.
   * @throws NotFoundException quando o post não existe.
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
  /**
   * Publica um post (altera `status` para `PUBLISHED`).
   *
   * @param id ID do post.
   * @returns Post com `status` publicado e `publishedAt` definido.
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
  /**
   * Despublica um post (altera `status` para `DRAFT`).
   *
   * @param id ID do post.
   * @returns Post com `status` rascunho e `publishedAt` nulo.
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
  /**
   * Lista posts por subcategoria.
   *
   * @param subcategoryId ID da subcategoria.
   * @returns Coleção de posts da subcategoria.
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
  /**
   * Lista posts por autor.
   *
   * @param authorId ID do autor.
   * @returns Coleção de posts do autor.
   */
  async getPostsByAuthor(authorId: string) {
    this.logger.log(`Getting posts by author: ${authorId}`);
    
    return await this.postsRepository.findByAuthor(authorId);
  }
}

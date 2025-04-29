import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostEntity } from './post.entity';

/**
 * @typedef SortOrder
 * @type {'asc' | 'desc'}
 * @description Ordenação dos resultados
 */
export type SortOrder = 'asc' | 'desc';

/**
 * @service PostService
 * @description Camada de serviço para operações relacionadas a posts
 * @method create - Cria novo post com cache invalidation
 * @method findById - Busca post com cache layer
 * @method update - Atualiza post com cache update
 * @method delete - Remove post com cache invalidation
 * @method findPostsByAuthor - Lista posts por autor com ordenação
 * @method findPostsByCategory - Lista posts por categoria
 * @method findRecentPosts - Lista posts recentes paginados
 * @method findBySlug - Busca post por slug
 * @method findPopularByCategory - Lista posts populares por categoria
 */
@Injectable()
export class PostService {
  private readonly CACHE_PREFIX = 'post_';
  private readonly DEFAULT_LIMIT = 10;

  constructor(
    private readonly postRepository: PostRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  /**
   * @description Cria novo post e limpa cache relacionado
   * @param createDto DTO de criação
   * @returns PostEntity criada
   */
  async create(createDto: CreatePostDto): Promise<PostEntity> {
    const post = await this.postRepository.create(createDto);
    await this.clearCache(post.id);
    return post;
  }

  /**
   * @description Busca post por ID com cache layer
   * @param id ID do post
   * @throws NotFoundException se não encontrado
   * @returns PostEntity com dados completos
   */
  async findById(id: string): Promise<PostEntity> {
    const cacheKey = this.getCacheKey(id);
    const cachedPost = await this.cacheManager.get<PostEntity>(cacheKey);

    if (cachedPost) {
      return cachedPost;
    }

    const post = await this.postRepository.findById(id);
    await this.cacheManager.set(cacheKey, post);
    return post;
  }

  /**
   * @description Atualiza post e atualiza cache
   * @param id ID do post
   * @param updateDto DTO de atualização
   * @returns PostEntity atualizada
   */
  async update(id: string, updateDto: UpdatePostDto): Promise<PostEntity> {
    const post = await this.postRepository.update(id, updateDto);
    await this.updateCache(post);
    return post;
  }

  /**
   * @description Remove post e limpa cache
   * @param id ID do post
   */
  async delete(id: string): Promise<void> {
    await this.postRepository.delete(id);
    await this.clearCache(id);
  }

  /**
   * @description Lista posts por autor com ordenação
   * @param authorId ID do autor
   * @param sort Direção da ordenação
   * @returns Lista de PostEntity ordenada
   */
  async findPostsByAuthor(
    authorId: string,
    sort: SortOrder = 'desc',
  ): Promise<PostEntity[]> {
    const posts = await this.postRepository.findPostsByAuthor(authorId);
    return sort === 'asc' ? posts.reverse() : posts;
  }

  /**
   * @description Lista posts por categoria
   * @param categoryId ID da categoria
   * @returns Lista de PostEntity ordenada por popularidade
   */
  async findPostsByCategory(categoryId: string): Promise<PostEntity[]> {
    return this.postRepository.findPostsByCategory(categoryId);
  }

  /**
   * @description Lista posts recentes paginados
   * @param limit Limite de resultados
   * @returns Lista de PostEntity recentes
   */
  async findRecentPosts(limit: number = this.DEFAULT_LIMIT): Promise<PostEntity[]> {
    const posts = await this.postRepository.findRecentPosts();
    return posts.slice(0, limit);
  }

  /**
   * @description Lista posts populares por categoria
   * @param categoryId ID da categoria
   * @param limit Limite de resultados
   * @returns Lista de PostEntity ordenada por views
   */
  async findPopularByCategory(
    categoryId: string,
    limit: number = this.DEFAULT_LIMIT,
  ): Promise<PostEntity[]> {
    const posts = await this.postRepository.findPostsByCategory(categoryId);
    return posts.slice(0, limit);
  }

  /**
   * @description Busca post por slug
   * @param slug Slug único do post
   * @throws NotFoundException se não encontrado
   * @returns PostEntity correspondente
   */
  async findBySlug(slug: string): Promise<PostEntity> {
    return this.postRepository.findBySlug(slug);
  }

  /**
   * @description Lista posts recentes paginados
   * @param limit Limite de resultados
   * @param lastKey Chave do último item da página anterior (para paginação)
   * @returns Lista de PostEntity recentes e lastKey para próxima página
   */
  async findRecentPostsPaginated(
    limit: number = this.DEFAULT_LIMIT,
    lastKey?: string,
  ): Promise<{ items: PostEntity[]; lastKey?: string }> {
    const cacheKey = this.getPagedCacheKey('recent', { limit, lastKey });
    const cached = await this.cacheManager.get<{ items: PostEntity[]; lastKey?: string }>(cacheKey);
    if (cached) return cached;
    const result = await this.postRepository.findRecentPostsPaginated(limit, lastKey);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  /**
   * @description Lista posts populares por categoria com paginação
   * @param categoryId ID da categoria
   * @param limit Limite de resultados
   * @param lastKey Token de paginação seguro (base64url)
   * @returns Lista de PostEntity e lastKey para próxima página
   */
  async findPopularByCategoryPaginated(
    categoryId: string,
    limit: number = this.DEFAULT_LIMIT,
    lastKey?: string,
  ): Promise<{ items: PostEntity[]; lastKey?: string }> {
    const cacheKey = this.getPagedCacheKey('popular', { categoryId, limit, lastKey });
    const cached = await this.cacheManager.get<{ items: PostEntity[]; lastKey?: string }>(cacheKey);
    if (cached) return cached;
    const result = await this.postRepository.findPostsByCategoryPaginated(categoryId, limit, lastKey);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  /**
   * @description Lista posts por autor com paginação
   * @param authorId ID do autor
   * @param limit Limite de resultados
   * @param lastKey Token de paginação seguro (base64url)
   * @returns Lista de PostEntity e lastKey para próxima página
   */
  async findPostsByAuthorPaginated(
    authorId: string,
    limit: number = this.DEFAULT_LIMIT,
    lastKey?: string,
  ): Promise<{ items: PostEntity[]; lastKey?: string }> {
    const cacheKey = this.getPagedCacheKey('author', { authorId, limit, lastKey });
    const cached = await this.cacheManager.get<{ items: PostEntity[]; lastKey?: string }>(cacheKey);
    if (cached) return cached;
    const result = await this.postRepository.findPostsByAuthorPaginated(authorId, limit, lastKey);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  /**
   * @description Lista posts por categoria com paginação
   * @param categoryId ID da categoria
   * @param limit Limite de resultados
   * @param lastKey Token de paginação seguro (base64url)
   * @returns Lista de PostEntity e lastKey para próxima página
   */
  async findPostsByCategoryPaginated(
    categoryId: string,
    limit: number = this.DEFAULT_LIMIT,
    lastKey?: string,
  ): Promise<{ items: PostEntity[]; lastKey?: string }> {
    const cacheKey = this.getPagedCacheKey('category', { categoryId, limit, lastKey });
    const cached = await this.cacheManager.get<{ items: PostEntity[]; lastKey?: string }>(cacheKey);
    if (cached) return cached;
    const result = await this.postRepository.findPostsByCategoryPaginated(categoryId, limit, lastKey);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  /**
   * @description Busca posts por slug com paginação
   * @param slug Slug do post
   * @param limit Limite de resultados
   * @param lastKey Token de paginação seguro (base64url)
   * @returns Lista de PostEntity e lastKey para próxima página
   */
  async findBySlugPaginated(
    slug: string,
    limit: number = this.DEFAULT_LIMIT,
    lastKey?: string,
  ): Promise<{ items: PostEntity[]; lastKey?: string }> {
    const cacheKey = this.getPagedCacheKey('slug', { slug, limit, lastKey });
    const cached = await this.cacheManager.get<{ items: PostEntity[]; lastKey?: string }>(cacheKey);
    if (cached) return cached;
    const result = await this.postRepository.findBySlugPaginated(slug, limit, lastKey);
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  /**
   * @description Gera chave de cache para o post
   * @param id ID do post
   * @returns Chave de cache formatada
   */
  private getCacheKey(id: string): string {
    return `${this.CACHE_PREFIX}${id}`;
  }

  /**
   * Gera chave de cache para buscas paginadas (por autor, categoria, slug, etc)
   */
  private getPagedCacheKey(prefix: string, params: Record<string, unknown>): string {
    // Exemplo: post_page_author_yjb8rx-240_limit_10_lastKey_xxx
    const parts = [this.CACHE_PREFIX, 'page', prefix];
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        parts.push(`${key}_${value}`);
      }
    }
    return parts.join('_');
  }

  /**
   * @description Atualiza cache do post
   * @param post PostEntity atualizada
   */
  private async updateCache(post: PostEntity): Promise<void> {
    await this.cacheManager.set(this.getCacheKey(post.id), post);
  }

  /**
   * @description Limpa cache do post
   * @param id ID do post
   */
  private async clearCache(id: string): Promise<void> {
    await this.cacheManager.del(this.getCacheKey(id));
  }
}
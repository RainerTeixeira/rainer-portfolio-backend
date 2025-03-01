import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DynamoDbService } from '../../../../services/dynamoDb.service';
import {
  CreatePostDto,
  UpdatePostDto,
  PostDetailDto,
  BlogSummaryDto,
  PostContentDto,
  PostSummaryDto,
  PostOperationResponseDto,
  CategoryStatsDto,
  SeoMetadataDto,
} from '../dto';
import { v4 as uuidv4 } from 'uuid';
import {
  GetCommandInput,
  PutCommandInput,
  QueryCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName = 'Posts';

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  /**
   * Cria um novo post.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado.
   */
  async createPost(createPostDto: CreatePostDto): Promise<PostDetailDto> {
    try {
      const compositeKey = `${createPostDto.categoryId}#${createPostDto.subcategoryId}`;
      const postId = uuidv4();

      const postItem = {
        'categoryId#subcategoryId': compositeKey,
        postId,
        createdAt: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        ...this.sanitizePostData(createPostDto),
      };

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: postItem,
      };

      await this.dynamoDbService.putItem(params);
      await this.refreshRelatedCaches(compositeKey, postId);
      return this.mapToDetailDto(postItem);
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error.message}`);
      throw new BadRequestException('Falha ao criar post');
    }
  }

  /**
   * Busca o resumo do blog.
   * @returns O resumo do blog.
   */
  async getBlogSummary(): Promise<BlogSummaryDto> {
    const cacheKey = 'blog_summary';
    try {
      const cached = await this.cacheManager.get<BlogSummaryDto>(cacheKey);
      if (cached) return cached;

      const [latestPosts, categoriesStats] = await Promise.all([
        this.getLatestPosts(),
        this.getCategoriesStats(),
      ]);

      const summary: BlogSummaryDto = {
        metadata: {
          totalPosts: latestPosts.length,
          lastUpdated: new Date().toISOString(),
        },
        featuredPosts: latestPosts.slice(0, 3),
        recentPosts: latestPosts.slice(3),
        categories: categoriesStats,
      };

      await this.cacheManager.set(cacheKey, summary, 3600); // 1 hora de cache
      return summary;
    } catch (error) {
      this.logger.error(`Erro ao buscar resumo do blog: ${error.message}`);
      throw new BadRequestException('Falha ao carregar resumo do blog');
    }
  }

  /**
   * Busca o conteúdo completo de um post.
   * @param postId - Identificador do post.
   * @returns O conteúdo completo do post.
   */
  async getFullPostContent(postId: string): Promise<PostContentDto> {
    try {
      const post = await this.getPostById(postId);
      const relatedPosts = await this.getRelatedPosts(post.categoryId, postId);

      return {
        ...post,
        relatedPosts,
        metadata: {
          seo: this.generateSeoMetadata(post),
          readingTime: this.calculateReadingTime(post.contentHTML),
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar post completo: ${error.message}`);
      throw new NotFoundException('Post não encontrado');
    }
  }

  /**
   * Busca posts por categoria.
   * @param categoryId - Identificador da categoria.
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @returns Uma lista de posts resumidos.
   */
  async getPostsByCategory(
    categoryId: string,
    page: number,
    limit: number
  ): Promise<PostSummaryDto[]> {
    const cacheKey = `posts_category_${categoryId}_${page}_${limit}`;
    try {
      const cached = await this.cacheManager.get<PostSummaryDto[]>(cacheKey);
      if (cached) return cached;

      const posts = await this.queryPostsByCategory(categoryId, page, limit);
      await this.cacheManager.set(cacheKey, posts, 300); // 5 minutos de cache
      return posts;
    } catch (error) {
      this.logger.error(`Erro ao buscar posts por categoria: ${error.message}`);
      throw new BadRequestException('Falha ao carregar posts');
    }
  }

  /**
   * Busca posts por subcategoria.
   * @param subcategoryId - Identificador da subcategoria.
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @returns Uma lista de posts resumidos.
   */
  async getPostsBySubcategory(
    subcategoryId: string,
    page: number,
    limit: number
  ): Promise<PostSummaryDto[]> {
    const cacheKey = `posts_subcategory_${subcategoryId}_${page}_${limit}`;
    try {
      const cached = await this.cacheManager.get<PostSummaryDto[]>(cacheKey);
      if (cached) return cached;

      const posts = await this.queryPostsBySubcategory(subcategoryId, page, limit);
      await this.cacheManager.set(cacheKey, posts, 300); // 5 minutos de cache
      return posts;
    } catch (error) {
      this.logger.error(`Erro ao buscar posts por subcategoria: ${error.message}`);
      throw new BadRequestException('Falha ao carregar posts');
    }
  }

  /**
   * Atualiza um post existente.
   * @param postId - Identificador do post.
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado.
   */
  async updatePost(
    postId: string,
    updatePostDto: UpdatePostDto
  ): Promise<PostDetailDto> {
    try {
      const existingPost = await this.getPostById(postId);
      const compositeKey = `${updatePostDto.categoryId}#${updatePostDto.subcategoryId}`;

      const updateParams: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': existingPost['categoryId#subcategoryId'],
          postId,
        },
        UpdateExpression: this.buildUpdateExpression(updatePostDto),
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamoDbService.updateItem(updateParams);
      await this.refreshRelatedCaches(compositeKey, postId);
      return this.mapToDetailDto(result.Attributes);
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar post');
    }
  }

  /**
   * Deleta um post.
   * @param postId - Identificador do post.
   */
  async deletePost(postId: string): Promise<void> {
    try {
      const post = await this.getPostById(postId);
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': post['categoryId#subcategoryId'],
          postId,
        },
      };

      await this.dynamoDbService.deleteItem(params);
      await this.refreshRelatedCaches(post['categoryId#subcategoryId'], postId);
    } catch (error) {
      this.logger.error(`Erro ao deletar post: ${error.message}`);
      throw new BadRequestException('Falha ao deletar post');
    }
  }

  // Métodos auxiliares...

  /**
   * Busca um post pelo seu ID.
   * @param postId - Identificador do post.
   * @returns O post encontrado.
   */
  private async getPostById(postId: string): Promise<PostDetailDto> {
    try {
      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: { postId },
      };

      const result = await this.dynamoDbService.getItem(params);
      if (!result.Item) {
        throw new NotFoundException('Post não encontrado');
      }

      return this.mapToDetailDto(result.Item);
    } catch (error) {
      this.logger.error(`Erro ao buscar post por ID: ${error.message}`);
      throw new NotFoundException('Post não encontrado');
    }
  }

  /**
   * Busca posts relacionados.
   * @param categoryId - Identificador da categoria.
   * @param excludePostId - Identificador do post a ser excluído.
   * @returns Uma lista de posts relacionados.
   */
  private async getRelatedPosts(categoryId: string, excludePostId: string): Promise<PostSummaryDto[]> {
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'categoryId-index', // Supondo que exista um índice secundário global em categoryId
        KeyConditionExpression: '#categoryId = :categoryId AND postId <> :excludePostId',
        ExpressionAttributeNames: {
          '#categoryId': 'categoryId',
        },
        ExpressionAttributeValues: {
          ':categoryId': categoryId,
          ':excludePostId': excludePostId,
        },
        Limit: 5,
      };

      const result = await this.dynamoDbService.query(params);
      return result.Items.map(item => this.mapToSummaryDto(item));
    } catch (error) {
      this.logger.error(`Erro ao buscar posts relacionados: ${error.message}`);
      throw new BadRequestException('Falha ao carregar posts relacionados');
    }
  }

  /**
   * Busca estatísticas de categorias.
   * @returns Uma lista de estatísticas de categorias.
   */
  private async getCategoriesStats(): Promise<CategoryStatsDto[]> {
    try {
      // Implementação fictícia para exemplo
      const categoriesStats: CategoryStatsDto[] = [
        {
          id: 'category1',
          name: 'Categoria 1',
          postCount: 10,
          latestPost: {
            postId: 'post1',
            title: 'Post 1',
            featuredImage: 'https://example.com/image1.jpg',
            publishDate: new Date().toISOString(),
            readingTime: 5,
          },
        },
        // Adicione mais categorias conforme necessário
      ];

      return categoriesStats;
    } catch (error) {
      this.logger.error(`Erro ao buscar estatísticas de categorias: ${error.message}`);
      throw new BadRequestException('Falha ao carregar estatísticas de categorias');
    }
  }

  /**
   * Busca posts por categoria.
   * @param categoryId - Identificador da categoria.
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @returns Uma lista de posts resumidos.
   */
  private async queryPostsByCategory(categoryId: string, page: number, limit: number): Promise<PostSummaryDto[]> {
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'categoryId-index', // Supondo que exista um índice secundário global em categoryId
        KeyConditionExpression: '#categoryId = :categoryId',
        ExpressionAttributeNames: {
          '#categoryId': 'categoryId',
        },
        ExpressionAttributeValues: {
          ':categoryId': categoryId,
        },
        Limit: limit,
        ExclusiveStartKey: page > 1 ? { categoryId, postId: `page${page - 1}` } : undefined,
      };

      const result = await this.dynamoDbService.query(params);
      return result.Items.map(item => this.mapToSummaryDto(item));
    } catch (error) {
      this.logger.error(`Erro ao buscar posts por categoria: ${error.message}`);
      throw new BadRequestException('Falha ao carregar posts por categoria');
    }
  }

  /**
   * Busca posts por subcategoria.
   * @param subcategoryId - Identificador da subcategoria.
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @returns Uma lista de posts resumidos.
   */
  private async queryPostsBySubcategory(subcategoryId: string, page: number, limit: number): Promise<PostSummaryDto[]> {
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'subcategoryId-index', // Supondo que exista um índice secundário global em subcategoryId
        KeyConditionExpression: '#subcategoryId = :subcategoryId',
        ExpressionAttributeNames: {
          '#subcategoryId': 'subcategoryId',
        },
        ExpressionAttributeValues: {
          ':subcategoryId': subcategoryId,
        },
        Limit: limit,
        ExclusiveStartKey: page > 1 ? { subcategoryId, postId: `page${page - 1}` } : undefined,
      };

      const result = await this.dynamoDbService.query(params);
      return result.Items.map(item => this.mapToSummaryDto(item));
    } catch (error) {
      this.logger.error(`Erro ao buscar posts por subcategoria: ${error.message}`);
      throw new BadRequestException('Falha ao carregar posts por subcategoria');
    }
  }

  /**
   * Gera metadados SEO para um post.
   * @param post - Post para o qual os metadados serão gerados.
   * @returns Metadados SEO.
   */
  private generateSeoMetadata(post: PostDetailDto): SeoMetadataDto {
    return {
      title: post.title,
      description: post.description,
      keywords: post.keywords.join(', '),
      canonical: post.canonical,
      og: {
        type: 'article',
        image: post.featuredImageURL,
        publishedTime: post.publishDate,
      },
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        image: post.featuredImageURL,
        datePublished: post.publishDate,
        author: {
          '@type': 'Person',
          name: 'Autor do Post', // Substitua pelo nome real do autor
        },
      },
    };
  }

  /**
   * Calcula o tempo de leitura de um conteúdo.
   * @param content - Conteúdo para o qual o tempo de leitura será calculado.
   * @returns Tempo de leitura em minutos.
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200; // Média de palavras lidas por minuto
    const textLength = content.split(/\s+/).length; // Contagem de palavras
    return Math.ceil(textLength / wordsPerMinute);
  }

  /**
   * Atualiza os caches relacionados a um post.
   * @param compositeKey - Chave composta do post.
   * @param postId - Identificador do post.
   */
  private async refreshRelatedCaches(compositeKey: string, postId: string): Promise<void> {
    // Implementação fictícia para exemplo
    await this.cacheManager.del(`post_${postId}`);
    await this.cacheManager.del(`category_${compositeKey}`);
  }

  /**
   * Mapeia um item para um DTO de detalhe de post.
   * @param item - Item a ser mapeado.
   * @returns DTO de detalhe de post.
   */
  private mapToDetailDto(item: any): PostDetailDto {
    return {
      postId: item.postId,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      title: item.title,
      contentHTML: item.contentHTML,
      authorId: item.authorId,
      slug: item.slug,
      featuredImageURL: item.featuredImageURL,
      description: item.description,
      publishDate: item.publishDate,
      readingTime: item.readingTime,
      views: item.views,
      status: item.status,
      tags: item.tags,
      keywords: item.keywords,
      canonical: item.canonical,
    };
  }

  /**
   * Constrói a expressão de atualização para um post.
   * @param updateData - Dados de atualização.
   * @returns Expressão de atualização.
   */
  private buildUpdateExpression(updateData: UpdatePostDto): string {
    const updateFields = Object.keys(updateData).filter(key => key !== 'postId');
    const updateExpression = `SET ${updateFields.map(field => `#${field} = :${field}`).join(', ')}`;
    return updateExpression;
  }

  /**
   * Sanitiza os dados de um post.
   * @param postData - Dados do post a serem sanitizados.
   * @returns Dados sanitizados.
   */
  private sanitizePostData(postData: CreatePostDto | UpdatePostDto): any {
    const sanitizedData = { ...postData };
    delete sanitizedData.postId; // Remover postId se existir
    return sanitizedData;
  }

  /**
   * Busca os 20 posts mais recentes.
   * @returns Uma lista de resumos dos posts.
   */
  async getLatestPosts(): Promise<PostSummaryDto[]> {
    return this.getCachedOrQuery(
      'latest_posts',
      () => this.queryLatestPostsFromDb(),
      300 // 5 minutos
    );
  }

  /**
   * Mapeia um item para um DTO de resumo de post.
   * @param item - Item a ser mapeado.
   * @returns DTO de resumo de post.
   */
  private mapToSummaryDto(item: any): PostSummaryDto {
    return {
      postId: item.postId,
      title: item.title,
      featuredImage: item.featuredImageURL,
      publishDate: item.publishDate,
      readingTime: item.readingTime,
    };
  }

  /**
   * Busca posts paginados.
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @returns Uma lista paginada de resumos dos posts e o total de posts.
   */
  async getPaginatedPosts(page: number, limit: number): Promise<{ data: PostSummaryDto[]; total: number }> {
    // Implementação fictícia para exemplo
    const total = 100; // Total de posts (exemplo)
    const data: PostSummaryDto[] = []; // Lista de posts paginados (exemplo)
    return { data, total };
  }

  /**
   * Busca posts com filtros.
   * @param query - Termo de busca.
   * @param categoryId - Identificador da categoria (opcional).
   * @returns Uma lista de resumos dos posts que correspondem aos filtros.
   */
  async searchPosts(query: string, categoryId?: string): Promise<PostSummaryDto[]> {
    // Implementação fictícia para exemplo
    const posts: PostSummaryDto[] = []; // Lista de posts filtrados (exemplo)
    return posts;
  }

  /**
   * Busca o conteúdo completo de um post pelo slug.
   * @param slug - Slug do post.
   * @returns O conteúdo completo do post com dados relacionados.
   */
  async getFullPostContentBySlug(slug: string): Promise<PostContentDto> {
    // Implementação fictícia para exemplo
    const post: PostContentDto = {
      // Dados do post (exemplo)
      postId: '1',
      categoryId: '1',
      subcategoryId: '1',
      title: 'Post Title',
      contentHTML: '<p>Content</p>',
      authorId: '1',
      slug,
      featuredImageURL: 'https://example.com/image.jpg',
      description: 'Description',
      publishDate: new Date().toISOString(),
      readingTime: 5,
      views: 100,
      status: 'published',
      tags: ['tag1'],
      keywords: ['keyword1'],
      canonical: 'https://example.com/post',
      relatedPosts: [],
      metadata: {
        seo: {
          title: 'SEO Title',
          description: 'SEO Description',
          keywords: 'keyword1, keyword2',
          canonical: 'https://example.com/post',
        },
        readingTime: 5,
      },
    };
    return post;
  }

  /**
   * Cache hierárquico para listagens.
   * @param cacheKey - Chave do cache.
   * @param queryFn - Função de consulta ao banco de dados.
   * @param ttl - Tempo de vida do cache em segundos.
   * @returns Resultado da consulta ou do cache.
   */
  private async getCachedOrQuery(
    cacheKey: string,
    queryFn: () => Promise<any>,
    ttl: number
  ): Promise<any> {
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await queryFn();
    await this.cacheManager.set(cacheKey, result, ttl);
    return result;
  }

  /**
   * Pré-cache de conteúdo popular.
   */
  async warmUpPopularPostsCache(): Promise<void> {
    const popularPosts = await this.dynamoDbService.query({
      TableName: this.tableName,
      IndexName: 'views-index',
      Limit: 20,
      ScanIndexForward: false
    });

    await Promise.all(
      popularPosts.Items.map(post => 
        this.cacheManager.set(`post_${post.slug}`, post, 3600)
      )
    );
  }
}
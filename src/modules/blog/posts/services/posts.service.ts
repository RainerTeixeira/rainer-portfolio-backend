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
  PostSummaryDto,
  BlogSummaryDto,
  PostContentDto,
} from '../dto';
import { v4 as uuidv4 } from 'uuid';
import {
  GetCommandInput,
  PutCommandInput,
  QueryCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { CacheClear } from '../../../../common/decorators/cache-clear.decorator';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName = 'Posts';

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  /**
   * Cria um novo post.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado como PostDetailDto.
   */
  @CacheClear(['posts:*', 'post-details:*'])
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
   * Retorna os 20 posts mais recentes do blog.
   * @returns Uma lista de resumos dos posts (PostSummaryDto).
   */
  async getLatestPosts(): Promise<PostSummaryDto[]> {
    return this.getCachedOrQuery(
      'latest_posts',
      () => this.queryLatestPostsFromDb(),
      300, // Cache por 5 minutos
    );
  }

  /**
   * Retorna uma listagem paginada de posts.
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @returns Objeto com a lista de posts e o total de posts.
   */
  async getPaginatedPosts(page: number, limit: number): Promise<{ data: PostSummaryDto[]; total: number }> {
    // Implementação fictícia para exemplo
    const total = 100; // Exemplo de total de posts
    const data: PostSummaryDto[] = []; // Exemplo: lista vazia
    return { data, total };
  }

  /**
   * Realiza busca de posts com base em um termo e opcionalmente uma categoria.
   * @param query - Termo de busca.
   * @param categoryId - (Opcional) Identificador da categoria.
   * @returns Uma lista de resumos dos posts que correspondem aos filtros.
   */
  async searchPosts(query: string, categoryId?: string): Promise<PostSummaryDto[]> {
    // Implementação fictícia para exemplo
    return [];
  }

  /**
   * Retorna o conteúdo completo de um post com base no slug.
   * @param slug - Slug do post.
   * @returns O conteúdo completo do post como PostContentDto.
   */
  async getFullPostContentBySlug(slug: string): Promise<PostContentDto> {
    // Implementação fictícia para exemplo
    const post: PostContentDto = {
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
   * Busca um post pelo seu ID.
   * @param postId - Identificador do post.
   * @returns O post encontrado como PostDetailDto.
   */
  async getPostById(postId: string): Promise<PostDetailDto> {
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
   * Atualiza um post existente.
   * @param postId - Identificador do post.
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado como PostDetailDto.
   */
  @CacheClear(['posts:*', 'post-details:*'])
  async updatePost(postId: string, updatePostDto: UpdatePostDto): Promise<PostDetailDto> {
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
  @CacheClear(['posts:*', 'post-details:*'])
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

  // ────────────────────────── Métodos Auxiliares ──────────────────────────

  /**
   * Consulta os 20 posts mais recentes utilizando o índice "postsByPublishDate-index".
   * @returns Uma lista de resumos dos posts.
   */
  private async queryLatestPostsFromDb(): Promise<PostSummaryDto[]> {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: 'postsByPublishDate-index',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'published',
      },
      ScanIndexForward: false, // Ordenação decrescente: do mais recente para o mais antigo
      Limit: 20,
    };

    const result = await this.dynamoDbService.query(params);
    return result.Items.map(item => this.mapToSummaryDto(item));
  }

  /**
   * Mapeia um item retornado do banco de dados para o DTO de detalhe do post.
   * @param item - Item retornado.
   * @returns PostDetailDto.
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
   * Mapeia um item retornado do banco de dados para o DTO de resumo do post.
   * @param item - Item retornado.
   * @returns PostSummaryDto.
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
   * Constrói a expressão de atualização para o comando de update no DynamoDB.
   * @param updateData - Dados para atualização.
   * @returns Expressão de atualização.
   */
  private buildUpdateExpression(updateData: UpdatePostDto): string {
    const updateFields = Object.keys(updateData).filter(key => key !== 'postId');
    return `SET ${updateFields.map(field => `#${field} = :${field}`).join(', ')}`;
  }

  /**
   * Sanitiza os dados do post, removendo campos que não devem ser enviados ao banco.
   * @param postData - Dados do post.
   * @returns Dados sanitizados.
   */
  private sanitizePostData(postData: CreatePostDto | UpdatePostDto): any {
    const sanitizedData = { ...postData };
    delete sanitizedData.postId;
    return sanitizedData;
  }

  /**
   * Tenta recuperar um valor do cache. Caso não exista, executa a função de consulta e armazena o resultado.
   * @param cacheKey - Chave do cache.
   * @param queryFn - Função que realiza a consulta.
   * @param ttl - Tempo de vida do cache em segundos.
   * @returns O resultado da consulta.
   */
  private async getCachedOrQuery(
    cacheKey: string,
    queryFn: () => Promise<any>,
    ttl: number,
  ): Promise<any> {
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;
    const result = await queryFn();
    await this.cacheManager.set(cacheKey, result, ttl);
    return result;
  }

  /**
   * Atualiza os caches relacionados a um post, removendo chaves antigas.
   * @param compositeKey - Chave composta (categoria#subcategoria).
   * @param postId - Identificador do post.
   */
  private async refreshRelatedCaches(compositeKey: string, postId: string): Promise<void> {
    await this.cacheManager.del(`post_${postId}`);
    await this.cacheManager.del(`category_${compositeKey}`);
  }
}

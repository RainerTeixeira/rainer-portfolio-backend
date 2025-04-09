import {
  Injectable, Logger, Inject, CACHE_MANAGER,
  NotFoundException, BadRequestException, InternalServerErrorException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { DynamoDbService, DynamoDBOperationError } from '@src/services/dynamoDb.service';
import { PostStatus } from './entities/post.entity';
import { PostCreateDto, PostUpdateDto, PostFullDto, PaginatedPostsResult } from './dto';
import { generatePostId } from '@src/common/generateUUID/generatePostId';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName: string;

  constructor(
    private config: ConfigService,
    private dynamoDb: DynamoDbService,
    @Inject(CACHE_MANAGER) private cache: Cache
  ) {
    this.tableName = this.config.get<string>('DYNAMO_TABLE_NAME_POSTS', 'Posts');
  }

  /**
   * Obtém posts paginados usando cursor-based pagination
   * @param limit Número de itens por página (1-100)
   * @param nextKey Token codificado para paginação
   * @returns Resultado paginado com metadados
   */
  async getPaginatedPosts(
    limit: number = 10,
    nextKey?: string
  ): Promise<PaginatedPostsResult> {
    const cacheKey = `posts:list:${limit}:${nextKey || 'initial'}`;

    try {
      // Tenta recuperar do cache
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached as PaginatedPostsResult;
      }

      // Configura parâmetros da query
      const params = {
        TableName: this.tableName,
        IndexName: 'postsByPublishDate-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': PostStatus.PUBLISHED },
        Limit: Math.min(Math.max(limit, 1), 100),
        ExclusiveStartKey: nextKey ? this.decodeToken(nextKey) : undefined,
        ScanIndexForward: false // Ordenação DESC por publishDate
      };

      // Executa query no DynamoDB
      const { Items, LastEvaluatedKey, ...metadata } = await this.dynamoDb.query(params);

      // Mapeia resultado
      const result = {
        items: Items.map(this.mapToPostSummary),
        nextKey: LastEvaluatedKey ? this.encodeToken(LastEvaluatedKey) : null,
        metadata: {
          count: Items.length,
          scannedCount: metadata.ScannedCount,
          capacityUnits: metadata.ConsumedCapacity?.CapacityUnits
        }
      };

      // Armazena no cache por 5 minutos
      await this.cache.set(cacheKey, result, { ttl: 300 });
      return result;

    } catch (error) {
      this.handleDynamoError(error, 'Falha ao listar posts');
    }
  }

  /**
   * Busca um post completo pelo seu slug
   * @param slug Slug único do post
   * @returns Dados completos do post
   */
  async getPostBySlug(slug: string): Promise<PostFullDto> {
    const cacheKey = `posts:slug:${slug}`;

    try {
      // Tenta recuperar do cache
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached as PostFullDto;
      }

      // Configura query no índice de slug
      const params = {
        TableName: this.tableName,
        IndexName: 'slug-index',
        KeyConditionExpression: '#slug = :slug',
        ExpressionAttributeNames: { '#slug': 'slug' },
        ExpressionAttributeValues: { ':slug': slug },
        Limit: 1
      };

      const { Items } = await this.dynamoDb.query(params);
      if (!Items || Items.length === 0) {
        throw new NotFoundException('Post não encontrado');
      }

      const post = this.mapToPostFull(Items[0]);
      await this.cache.set(cacheKey, post, { ttl: 600 }); // Cache por 10 minutos
      return post;

    } catch (error) {
      this.handleDynamoError(error, 'Falha ao buscar post por slug');
    }
  }

  /**
   * Cria um novo post no banco de dados
   * @param dto Dados para criação do post
   * @returns Post criado com dados completos
   */
  async createPost(dto: PostCreateDto): Promise<PostFullDto> {
    const postId = generatePostId();
    const now = new Date().toISOString();

    try {
      const item = {
        postId,
        ...dto,
        createdAt: now,
        updatedAt: now,
        views: 0,
        status: dto.status || PostStatus.DRAFT
      };

      await this.dynamoDb.put({
        TableName: this.tableName,
        Item: item
      });

      await this.clearCache();
      return this.mapToPostFull(item);

    } catch (error) {
      this.handleDynamoError(error, 'Falha ao criar post');
    }
  }

  /**
   * Atualiza um post existente
   * @param postId ID único do post
   * @param dto Campos para atualização
   * @returns Post atualizado
   */
  async updatePost(postId: string, dto: PostUpdateDto): Promise<PostFullDto> {
    try {
      const updates = {
        ...dto,
        updatedAt: new Date().toISOString()
      };

      // Monta expressão de atualização dinâmica
      const updateExpression = Object.keys(updates)
        .map(key => `#${key} = :${key}`)
        .join(', ');

      const expressionAttributeNames = Object.keys(updates)
        .reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});

      const expressionAttributeValues = Object.entries(updates)
        .reduce((acc, [key, value]) => ({ ...acc, [`:${key}`]: value }), {});

      const params = {
        TableName: this.tableName,
        Key: { postId },
        UpdateExpression: `SET ${updateExpression}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      };

      const { Attributes } = await this.dynamoDb.update(params);
      await this.clearCache();
      return this.mapToPostFull(Attributes);

    } catch (error) {
      this.handleDynamoError(error, 'Falha ao atualizar post');
    }
  }

  /**
   * Exclui permanentemente um post
   * @param postId ID único do post
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await this.dynamoDb.delete({
        TableName: this.tableName,
        Key: { postId },
        ConditionExpression: 'attribute_exists(postId)'
      });
      await this.clearCache();
    } catch (error) {
      this.handleDynamoError(error, 'Falha ao excluir post');
    }
  }

  // Métodos auxiliares
  private mapToPostSummary(item: any): PostSummaryDto {
    return {
      id: item.postId,
      title: item.title,
      slug: item.slug,
      publishDate: new Date(item.publishDate),
      featuredImage: item.featuredImageURL,
      views: Number(item.views || 0),
      status: item.status
    };
  }

  private mapToPostFull(item: any): PostFullDto {
    return {
      ...this.mapToPostSummary(item),
      contentHTML: item.contentHTML,
      authorId: item.authorId,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      keywords: item.keywords || [],
      readingTime: Number(item.readingTime || 0)
    };
  }

  private encodeToken(key: Record<string, any>): string {
    return Buffer.from(JSON.stringify(key)).toString('base64url');
  }

  private decodeToken(token: string): Record<string, any> {
    try {
      return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    } catch (error) {
      throw new BadRequestException('Token de paginação inválido');
    }
  }

  private async clearCache() {
    const keys = await this.cache.store.keys();
    const postKeys = keys.filter(key => key.startsWith('posts:'));
    await Promise.all(postKeys.map(key => this.cache.del(key)));
    this.logger.log(`Cache limpo: ${postKeys.length} chaves removidas`);
  }

  private handleDynamoError(error: DynamoDBOperationError, contextMessage: string) {
    this.logger.error(`${contextMessage}: ${error.message}`, error.stack);

    switch (error.context?.errorCode) {
      case 'ConditionalCheckFailedException':
        throw new NotFoundException('Post não encontrado');
      case 'ValidationException':
        throw new BadRequestException('Dados de entrada inválidos');
      case 'ResourceNotFoundException':
        throw new NotFoundException('Recurso não encontrado no banco de dados');
      default:
        throw new InternalServerErrorException('Erro interno no processamento');
    }
  }
}
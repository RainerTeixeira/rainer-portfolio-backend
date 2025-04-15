import {
  Injectable, Logger, Inject, CACHE_MANAGER,
  NotFoundException, BadRequestException, InternalServerErrorException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { DynamoDbService, DynamoDBOperationError } from '@src/services/dynamoDb.service';
import { PostStatus } from './entities/post.entity';
import { PostCreateDto, PostUpdateDto, PostFullDto, PostSummaryDto, PaginatedPostsResult } from './dto'; // Certifique-se de que PostSummaryDto está importado
import { generatePostId } from '@src/common/utils/generatePostId'; // Supondo que este utilitário exista

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName: string;
  private readonly postsByDateIndex = 'postsByPublishDate-index'; // Nome do GSI
  private readonly slugIndex = 'slug-index'; // Nome do GSI

  constructor(
    private config: ConfigService,
    // Renomear o serviço injetado para clareza e evitar conflito com o nome da classe PostsService
    private dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cache: Cache
  ) {
    this.tableName = this.config.get<string>('DYNAMO_TABLE_NAME_POSTS', 'Posts');
  }

  /**
   * Obtém posts publicados paginados usando paginação baseada em cursor via GSI.
   * @param limit Número de itens por página (1-100)
   * @param nextKey Token codificado (base64url) para paginação
   * @returns Resultado paginado com metadados
   */
  async getPaginatedPosts(
    limit: number = 10,
    nextKey?: string
  ): Promise<PaginatedPostsResult> {
    const effectiveLimit = Math.min(Math.max(limit, 1), 100);
    const cacheKey = `posts:list:published:${effectiveLimit}:${nextKey || 'initial'}`;

    try {
      const cached = await this.cache.get<PaginatedPostsResult>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache encontrado para a lista de posts com chave: ${cacheKey}`);
        return cached;
      }

      const params = {
        TableName: this.tableName,
        IndexName: this.postsByDateIndex,
        KeyConditionExpression: '#status = :statusVal',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':statusVal': PostStatus.PUBLISHED }, // Usar sintaxe do DocumentClient
        Limit: effectiveLimit,
        ExclusiveStartKey: nextKey ? this.decodeToken(nextKey) : undefined,
        ScanIndexForward: false // Mais recentes primeiro (supondo que publishDate seja a chave de ordenação)
      };

      this.logger.debug(`Consultando DynamoDB para posts paginados com parâmetros: ${JSON.stringify(params)}`);
      const result = await this.dynamoDbService.query(params);

      const items = (result.data.Items || [])
        .map(item => PostSummaryDto.fromDynamoDbItem(item as Record<string, any>))
        .filter((post): post is PostSummaryDto => post !== null); // Filtrar nulos de erros de mapeamento

      const response: PaginatedPostsResult = {
        items: items,
        nextKey: result.data.LastEvaluatedKey ? this.encodeToken(result.data.LastEvaluatedKey) : null,
        metadata: {
          count: items.length,
          scannedCount: result.data.ScannedCount,
          // Acessar capacidade dos metadados do wrapper, se disponível, caso contrário dos dados
          capacityUnits: result.metadata?.capacityUnits || result.data.ConsumedCapacity?.CapacityUnits
        }
      };

      // Cache por 5 minutos
      await this.cache.set(cacheKey, response, 300); // Usar número direto para TTL
      return response;

    } catch (error) {
      // Deixar handleDynamoError gerenciar a exceção lançada
      this.handleDynamoError(error, `Falha ao listar posts publicados (limit: ${limit}, nextKey: ${nextKey})`);
    }
  }

  /**
   * Busca um post completo pelo seu slug usando um GSI.
   * @param slug Slug único do post.
   * @returns Dados completos do post.
   * @throws NotFoundException se o post não for encontrado.
   */
  async getPostBySlug(slug: string): Promise<PostFullDto> {
    if (!slug || typeof slug !== 'string') {
      throw new BadRequestException('Slug inválido fornecido.');
    }
    const cacheKey = `posts:slug:${slug}`;

    try {
      const cached = await this.cache.get<PostFullDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for post slug: ${slug}`);
        return cached;
      }

      const params = {
        TableName: this.tableName,
        IndexName: this.slugIndex,
        KeyConditionExpression: '#slug = :slugVal',
        ExpressionAttributeNames: { '#slug': 'slug' },
        ExpressionAttributeValues: { ':slugVal': slug }, // DocumentClient syntax
        Limit: 1 // Expect only one item for a unique slug
      };

      this.logger.debug(`Querying DynamoDB for post by slug: ${slug}`);
      const result = await this.dynamoDbService.query(params);

      if (!result.data.Items || result.data.Items.length === 0) {
        throw new NotFoundException(`Post com slug '${slug}' não encontrado.`);
      }

      const post = PostFullDto.fromDynamoDbItem(result.data.Items[0] as Record<string, any>);
      if (!post) {
        this.logger.error(`Failed to map data for post with slug '${slug}'. Item: ${JSON.stringify(result.data.Items[0])}`);
        throw new InternalServerErrorException('Erro ao processar os dados do post encontrado.');
      }

      // Cache por 10 minutos
      await this.cache.set(cacheKey, post, 600); // Use direct number for TTL
      return post;

    } catch (error) {
      this.handleDynamoError(error, `Failed to get post by slug: ${slug}`);
    }
  }

  /**
   * Busca um post completo pelo seu ID.
   * @param postId ID único do post.
   * @returns Dados completos do post.
   * @throws NotFoundException se o post não for encontrado.
   */
  async getPostById(postId: string): Promise<PostFullDto> {
    if (!this.isValidId(postId)) {
      throw new BadRequestException('ID do post inválido.');
    }
    // Não vamos cachear por ID primário aqui, pois o slug é o identificador principal para leitura pública.
    // Se precisar de cache por ID, adicionar lógica similar a getPostBySlug.
    try {
      const result = await this.dynamoDbService.get({
        TableName: this.tableName,
        Key: { postId: postId } // DocumentClient syntax
      });

      if (!result.data || !result.data.Item) {
        throw new NotFoundException(`Post com ID '${postId}' não encontrado.`);
      }

      const post = PostFullDto.fromDynamoDbItem(result.data.Item as Record<string, any>);
      if (!post) {
        this.logger.error(`Failed to map data for post with ID '${postId}'. Item: ${JSON.stringify(result.data.Item)}`);
        throw new InternalServerErrorException('Erro ao processar os dados do post encontrado.');
      }
      return post;

    } catch (error) {
      this.handleDynamoError(error, `Failed to get post by ID: ${postId}`);
    }
  }


  /**
   * Cria um novo post no banco de dados.
   * @param dto Dados para criação do post.
   * @returns Post criado com dados completos.
   */
  async createPost(dto: PostCreateDto): Promise<PostFullDto> {
    const postId = generatePostId(); // Assuming this returns a unique ID (like UUID)
    const now = new Date().toISOString();

    // Basic validation (add more as needed)
    if (!dto.slug || !dto.title || !dto.authorId || !dto.categoryId /* etc. */) {
      throw new BadRequestException("Dados essenciais para criação do post estão faltando.");
    }

    // TODO: Add check for slug uniqueness before creating? Query slug-index.

    const item = {
      postId,
      ...dto, // Spread DTO properties
      publishDate: dto.status === PostStatus.PUBLISHED ? (dto.publishDate || now) : undefined, // Set publishDate only if published
      createdAt: now,
      updatedAt: now,
      views: 0,
      status: dto.status || PostStatus.DRAFT // Default to DRAFT if not provided
    };

    // Remove undefined values explicitly if marshaller doesn't handle it perfectly
    Object.keys(item).forEach(key => item[key] === undefined && delete item[key]);


    try {
      this.logger.log(`Creating post with ID: ${postId}, Slug: ${item.slug}`);
      await this.dynamoDbService.put({
        TableName: this.tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(postId)' // Ensure postId is unique
      });

      // Clear relevant caches (potentially all list caches)
      await this.clearListCaches();

      // Map the created item (which we have locally) to the DTO
      const createdPost = PostFullDto.fromDynamoDbItem(item);
      if (!createdPost) {
        this.logger.error(`Failed to map newly created post item to DTO. Item: ${JSON.stringify(item)}`);
        throw new InternalServerErrorException("Erro ao processar o post recém-criado.");
      }
      return createdPost;

    } catch (error) {
      // Check if it's a conditional check failure (postId collision - unlikely with UUID)
      if (error instanceof DynamoDBOperationError && error.context.originalError === 'ConditionalCheckFailedException') {
        this.logger.error(`Post ID collision for ${postId}`);
        throw new InternalServerErrorException("Falha ao gerar ID único para o post. Tente novamente.");
      }
      this.handleDynamoError(error, `Failed to create post with slug: ${item.slug}`);
    }
  }

  /**
   * Atualiza um post existente.
   * @param postId ID único do post.
   * @param dto Campos para atualização.
   * @returns Post atualizado.
   * @throws NotFoundException se o post não for encontrado.
   */
  async updatePost(postId: string, dto: PostUpdateDto): Promise<PostFullDto> {
    if (!this.isValidId(postId)) {
      throw new BadRequestException('ID do post inválido.');
    }
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Nenhum dado fornecido para atualização.');
    }

    // Prevent updating postId
    if ('postId' in dto) {
      delete (dto as any).postId;
    }

    try {
      const now = new Date().toISOString();
      const updates = { ...dto }; // Copy DTO to avoid modifying original
      let originalSlug: string | undefined; // To clear old slug cache if slug changes

      // Special handling for status and publishDate
      if (updates.status === PostStatus.PUBLISHED && !updates.publishDate) {
        // If setting to published and no publishDate provided, set it to now
        // Fetch current post first to see if it already has a publishDate
        const currentPost = await this.getPostById(postId); // Reuse existing method (handles NotFound)
        originalSlug = currentPost.slug; // Get original slug
        if (!currentPost.publishDate) {
          updates.publishDate = now;
        }
      } else if (updates.publishDate) {
        // Ensure date format is correct if provided
        updates.publishDate = new Date(updates.publishDate).toISOString();
      }
      // Ensure updatedAt is always set
      updates.updatedAt = now;

      // Remove undefined values from updates
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

      if (Object.keys(updates).length === 0) {
        throw new BadRequestException("Nenhum campo válido para atualização após processamento.");
      }


      // Build UpdateExpression dynamically
      const updateExpressionParts: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      for (const [key, value] of Object.entries(updates)) {
        const namePlaceholder = `#${key}`;
        const valuePlaceholder = `:${key}`;
        updateExpressionParts.push(`${namePlaceholder} = ${valuePlaceholder}`);
        expressionAttributeNames[namePlaceholder] = key; // Map placeholder to actual attribute name
        expressionAttributeValues[valuePlaceholder] = value; // Map placeholder to value
      }

      const updateExpression = `SET ${updateExpressionParts.join(', ')}`;


      const params = {
        TableName: this.tableName,
        Key: { postId: postId }, // DocumentClient syntax
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: 'attribute_exists(postId)', // Ensure post exists
        ReturnValues: 'ALL_NEW' // Return the complete item after update
      };

      this.logger.log(`Updating post ID: ${postId}`);
      const result = await this.dynamoDbService.update(params);

      const updatedAttributes = result.data.Attributes;
      if (!updatedAttributes) {
        this.logger.error(`UpdateItem succeeded for post ${postId} but returned no attributes.`);
        throw new InternalServerErrorException("Falha ao obter dados atualizados do post após atualização.");
      }

      // Clear caches
      const updatedSlug = updatedAttributes.slug as string;
      await this.clearPostSlugCache(updatedSlug); // Clear cache for the new slug
      if (originalSlug && originalSlug !== updatedSlug) {
        await this.clearPostSlugCache(originalSlug); // Clear cache for the old slug if changed
      }
      await this.clearListCaches(); // Clear list caches

      const updatedPost = PostFullDto.fromDynamoDbItem(updatedAttributes as Record<string, any>);
      if (!updatedPost) {
        this.logger.error(`Failed to map updated attributes for post ${postId}. Attributes: ${JSON.stringify(updatedAttributes)}`);
        throw new InternalServerErrorException('Erro ao processar os dados atualizados do post.');
      }
      return updatedPost;

    } catch (error) {
      this.handleDynamoError(error, `Failed to update post ID: ${postId}`);
    }
  }

  /**
   * Exclui permanentemente um post.
   * @param postId ID único do post.
   * @throws NotFoundException se o post não for encontrado.
   */
  async deletePost(postId: string): Promise<void> {
    if (!this.isValidId(postId)) {
      throw new BadRequestException('ID do post inválido.');
    }
    try {
      // Fetch the post first to get the slug for cache clearing
      // getPostById will throw NotFoundException if it doesn't exist
      const postToDelete = await this.getPostById(postId);

      this.logger.log(`Deleting post ID: ${postId}, Slug: ${postToDelete.slug}`);
      await this.dynamoDbService.getdelete({
        TableName: this.tableName,
        Key: { postId: postId }, // DocumentClient syntax
        ConditionExpression: 'attribute_exists(postId)' // Optional: Redundant check if getPostById succeeded
      });

      // Clear relevant caches
      await this.clearPostSlugCache(postToDelete.slug);
      await this.clearListCaches();

    } catch (error) {
      // Handle potential ConditionCheckFailedException if getPostById was somehow skipped or race condition
      if (error instanceof DynamoDBOperationError && error.context.originalError === 'ConditionalCheckFailedException') {
        throw new NotFoundException(`Post com ID '${postId}' não encontrado para exclusão.`);
      }
      this.handleDynamoError(error, `Failed to delete post ID: ${postId}`);
    }
  }

  // --- Métodos auxiliares ---

  /** Checks if an ID string is valid (basic check). */
  private isValidId(id: string): boolean {
    return typeof id === 'string' && id.trim().length > 0;
    // Consider adding UUID validation if postId is always a UUID
  }

  /** Encodes DynamoDB key object to a base64url string for pagination. */
  private encodeToken(key: Record<string, any>): string {
    return Buffer.from(JSON.stringify(key)).toString('base64url');
  }

  /** Decodes base64url pagination token back to a DynamoDB key object. */
  private decodeToken(token: string): Record<string, any> {
    try {
      return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    } catch (error) {
      this.logger.error(`Invalid pagination token received: ${token}`, error);
      throw new BadRequestException('Token de paginação inválido ou corrompido.');
    }
  }

  /** Clears cache for a specific post slug. */
  private async clearPostSlugCache(slug: string): Promise<void> {
    if (slug) {
      const cacheKey = `posts:slug:${slug}`;
      this.logger.debug(`Clearing slug cache: ${cacheKey}`);
      await this.cache.del(cacheKey);
    }
  }

  /** Clears all known list-related caches. */
  private async clearListCaches(): Promise<void> {
    // More robust than scanning all keys: delete known patterns
    // This assumes the list cache keys follow the 'posts:list:*' pattern
    // WARNING: This still relies on pattern matching and might be slow/inefficient depending on cache store.
    try {
      const keys = await this.cache.store.keys('posts:list:*');
      if (keys && keys.length > 0) {
        await Promise.all(keys.map(key => this.cache.del(key)));
        this.logger.log(`Cleared ${keys.length} list cache keys matching 'posts:list:*'.`);
      } else {
        this.logger.log("No list cache keys found to clear.");
      }
    } catch (error) {
      // Log error but don't fail the operation just because cache clearing failed
      this.logger.error("Failed to clear list caches:", error);
    }
  }

  // /** More targeted cache clearing (alternative to clearListCaches) */
  // private async clearRelevantCaches(post: { slug: string; status: PostStatus }): Promise<void> {
  //     const slugKey = `posts:slug:${post.slug}`;
  //     await this.cache.del(slugKey);
  //     // Selectively clear list caches, e.g., only the first page if status changed
  //     if (post.status === PostStatus.PUBLISHED) {
  //        const firstPageKey = `posts:list:published:10:initial`; // Example: clear first page
  //        await this.cache.del(firstPageKey);
  //     }
  //     this.logger.debug(`Cleared caches for slug ${post.slug} and potentially relevant lists.`);
  // }


  /** Centralized error handler for DynamoDB operations via the wrapper service. */
  private handleDynamoError(error: unknown, contextMessage: string): never {
    if (error instanceof DynamoDBOperationError) {
      const originalError = error.context.originalError;
      this.logger.error(`[DynamoDB Error - ${contextMessage}] Operation: ${error.operation}, Original Error: ${originalError}, Message: ${error.message}`, error.stack);
      this.logger.error(`Context Params: ${JSON.stringify(error.context.params)}`);

      switch (originalError) {
        case 'ConditionalCheckFailedException':
          // Context matters: could be Not Found or Conflict/Precondition Failed
          if (error.operation === 'put' || error.operation === 'update' || error.operation === 'getdelete') {
            throw new NotFoundException(`Falha na operação: O post alvo não foi encontrado ou a condição não foi atendida (${contextMessage}).`);
          } else {
            // Should not happen often for Query/Scan/GetItem unless using conditional reads
            throw new BadRequestException(`Falha na condição da operação (${contextMessage}).`);
          }
        case 'ValidationException':
          throw new BadRequestException(`Dados inválidos na requisição ao DynamoDB: ${error.message} (${contextMessage})`);
        case 'ResourceNotFoundException':
          // Can be table not found or index not found
          this.logger.error(`DynamoDB Resource Not Found: Table=${this.tableName}, Index=${error.context.params?.['IndexName'] || 'N/A'}`);
          throw new InternalServerErrorException(`Recurso necessário (${this.tableName} ou índice) não encontrado no banco de dados (${contextMessage}).`);
        case 'ProvisionedThroughputExceededException':
        case 'ThrottlingException':
          this.logger.warn(`DynamoDB Throttling/Capacity Exceeded: ${originalError} (${contextMessage})`);
          throw new InternalServerErrorException(`Serviço temporariamente sobrecarregado. Tente novamente mais tarde.`);
        case 'ItemCollectionSizeLimitExceededException':
          this.logger.error(`DynamoDB Item Collection Size Limit Exceeded for PK: ${JSON.stringify(error.context.params?.['Key'])} (${contextMessage})`);
          throw new InternalServerErrorException('Limite de armazenamento para este item foi excedido.');
        default:
          throw new InternalServerErrorException(`Erro interno no processamento do banco de dados (${originalError}) (${contextMessage})`);
      }
    } else if (error instanceof NotFoundException || error instanceof BadRequestException) {
      // Re-throw known HTTP exceptions
      throw error;
    } else if (error instanceof Error) {
      // Catch-all for other errors
      this.logger.error(`[Error - ${contextMessage}] ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Erro interno inesperado (${contextMessage})`);
    } else {
      // Unknown error type
      this.logger.error(`[Unknown Error - ${contextMessage}] ${String(error)}`);
      throw new InternalServerErrorException(`Erro interno desconhecido (${contextMessage})`);
    }
  }
}
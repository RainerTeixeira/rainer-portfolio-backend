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
  PostCreateDto,
  PostUpdateDto,
  PostContentDto,
  PostSummaryDto,
  PostDetailDto,
} from '../dto';
import { v4 as uuidv4 } from 'uuid';
import {
  GetCommandInput,
  PutCommandInput,
  QueryCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  ScanCommandInput
} from '@aws-sdk/lib-dynamodb';
import { CacheClear } from '../../../../common/decorators/cache-clear.decorator';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName = 'Posts';
  private readonly latestPostsCacheKey = 'latest_posts';
  private readonly paginatedPostsCacheKeyPrefix = 'paginated_posts:';

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  /**
   * Cria um novo post.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado como PostContentDto.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  async createPost(createPostDto: PostCreateDto): Promise<PostContentDto> {
    try {
      const compositeKey = `${createPostDto.categoryId}#${createPostDto.subcategoryId}`;
      const postId = uuidv4();
      const publishDate = new Date().toISOString(); // Generate publish date on creation

      const postItem = {
        'categoryId#subcategoryId': compositeKey,
        postId,
        createdAt: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        publishDate: publishDate, // Add publishDate
        views: 0, // Initialize views
        status: 'draft', // Default status to draft, adjust as needed
        ...this.sanitizePostData(createPostDto),
      };

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: postItem,
      };

      await this.dynamoDbService.putItem(params);
      await this.refreshRelatedCaches(compositeKey, postId);
      return this.mapToContentDto(postItem); // Map to PostContentDto as requested
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error.message}`);
      throw new BadRequestException('Falha ao criar post');
    }
  }

  /**
   * Retorna uma listagem paginada de posts.
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @returns Objeto com a lista de posts e o total de posts.
   */
  async getPaginatedPosts(page: number, limit: number): Promise<{ data: PostSummaryDto[]; total: number }> {
    const cacheKey = `${this.paginatedPostsCacheKeyPrefix}page:${page}_limit:${limit}`;
    return this.getCachedOrQuery(
      cacheKey,
      () => this.queryPaginatedPostsFromDb(page, limit),
      300, // Cache for 5 minutes
    );
  }

  /**
   * Retorna um post completo (PostContentDto) com base no slug.
   * @param slug - Slug do post.
   * @returns O post completo do post como PostContentDto.
   */
  async getPostBySlug(slug: string): Promise<PostContentDto> {
    // In a real scenario, you would likely need a GSI to efficiently query by slug
    // For now, this is a placeholder implementation assuming slug is part of post data.
    // Consider adding a GSI for 'slug' if frequent lookup by slug is needed.
    const dummyPost: PostContentDto = { // Replace with actual logic to fetch by slug
      title: 'Dummy Post Title',
      slug: slug,
      contentHTML: '<p>This is a dummy post content.</p>',
      featuredImageURL: 'https://example.com/dummy-image.jpg',
      keywords: ['dummy', 'post'],
      publishDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      readingTime: 3,
      tags: ['dummy-tag'],
      views: 50,
    };
    return dummyPost; // Replace with actual database lookup and mapping
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
   * @returns O post atualizado como PostContentDto.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  async updatePost(postId: string, updatePostDto: PostUpdateDto): Promise<PostContentDto> {
    try {
      const existingPost = await this.getPostById(postId); // Ensure getPostById retrieves item with composite key
      const compositeKey = existingPost['categoryId#subcategoryId']; // Retrieve composite key from existing post

      const updateParams: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': compositeKey,
          postId: postId,
        },
        UpdateExpression: this.buildUpdateExpression(updatePostDto),
        ExpressionAttributeNames: this.getUpdateExpressionAttributeNames(updatePostDto), // Generate names
        ExpressionAttributeValues: this.getUpdateExpressionAttributeValues(updatePostDto), // Generate values
        ReturnValues: 'ALL_NEW',
      };


      const result = await this.dynamoDbService.updateItem(updateParams);
      await this.refreshRelatedCaches(compositeKey, postId);
      return this.mapToContentDto(result.Attributes); // Map to PostContentDto
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar post');
    }
  }

  /**
   * Deleta um post.
   * @param postId - Identificador do post.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  async deletePost(postId: string): Promise<void> {
    try {
      const post = await this.getPostById(postId);
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': post['categoryId#subcategoryId'],
          postId: postId,
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
   * Consulta para listagem paginada de posts do DynamoDB.
   * @param page - Número da página.
   * @param limit - Limite por página.
   * @returns Dados paginados e total de posts.
   */
  private async queryPaginatedPostsFromDb(page: number, limit: number): Promise<{ data: PostSummaryDto[]; total: number }> {
    const startIndex = (page - 1) * limit; // Calculate start index for pagination - DynamoDB Scan doesn't directly support offset
    const scanParams: ScanCommandInput = {
      TableName: this.tableName,
      Limit: limit, // Limit items per page
    };

    try {
      const result = await this.dynamoDbService.scan(scanParams); // Use Scan for now - consider more efficient approaches for large datasets
      const items = result.Items || [];
      const total = items.length; // Inefficient total calculation for Scan - for large datasets, consider a dedicated count mechanism

      const paginatedItems = items.slice(0, limit); // Apply limit after scan (Scan reads from start) -  for true pagination, use exclusiveStartKey and lastEvaluatedKey in subsequent requests.
      const data = paginatedItems.map(item => this.mapToSummaryDto(item));


      return { data, total }; // Returning total as items.length here is just for example. For real total count in DynamoDB with Scan, it's complex and inefficient.
    } catch (error) {
      this.logger.error(`Erro ao executar Scan paginado: ${error.message}`, error.stack);
      return { data: [], total: 0 }; // Return empty data and total on error
    }
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
   * Mapeia um item retornado do banco de dados para o DTO de conteúdo do post.
   * @param item - Item retornado.
   * @returns PostContentDto.
   */
  private mapToContentDto(item: any): PostContentDto {
    return {
      title: item.title,
      slug: item.slug,
      contentHTML: item.contentHTML,
      featuredImageURL: item.featuredImageURL,
      keywords: item.keywords,
      publishDate: item.publishDate,
      modifiedDate: item.modifiedDate,
      readingTime: item.readingTime,
      tags: item.tags,
      views: item.views,
      // ... map other fields as needed based on your PostContentDto - adjust if you have more fields in PostContentDto
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
      featuredImageURL: item.featuredImageURL,
      description: item.description, // Assuming description is in your DynamoDB item
      publishDate: item.publishDate,
      readingTime: item.readingTime,
    };
  }

  /**
   * Constrói a expressão de atualização para o comando de update no DynamoDB.
   * @param updateData - Dados para atualização.
   * @returns Expressão de atualização.
   */
  private buildUpdateExpression(updateData: PostUpdateDto): string {
    const updateFields = Object.keys(updateData).filter(key => key !== 'postId');
    return `SET ${updateFields.map(field => `#${field} = :${field}`).join(', ')}`;
  }

  /**
   * Gera ExpressionAttributeNames para update expression to avoid reserved words.
   * @param updateData - Dados para atualização.
   * @returns ExpressionAttributeNames object.
   */
  private getUpdateExpressionAttributeNames(updateData: PostUpdateDto): any {
    const attributeNames: any = {};
    Object.keys(updateData).filter(key => key !== 'postId').forEach(field => {
      attributeNames[`#${field}`] = field;
    });
    return attributeNames;
  }

  /**
   * Gera ExpressionAttributeValues for update expression.
   * @param updateData - Dados para atualização.
   * @returns ExpressionAttributeValues object.
   */
  private getUpdateExpressionAttributeValues(updateData: PostUpdateDto): any {
    const attributeValues: any = {};
    Object.keys(updateData).filter(key => key !== 'postId').forEach(field => {
      attributeValues[`:${field}`] = updateData[field];
    });
    return attributeValues;
  }


  /**
   * Sanitiza os dados do post, removendo campos que não devem ser enviados ao banco.
   * @param postData - Dados do post.
   * @returns Dados sanitizados.
   */
  private sanitizePostData(postData: PostCreateDto | PostUpdateDto): any {
    const sanitizedData = { ...postData };
    delete sanitizedData.postId;
    delete sanitizedData.categoryIdSubcategoryId;
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
    await this.cacheManager.del(this.latestPostsCacheKey); // Clear latest posts cache
    await this.cacheManager.del(this.paginatedPostsCacheKeyPrefix); // Clear paginated posts cache prefix - consider more specific invalidation if needed.
  }
}
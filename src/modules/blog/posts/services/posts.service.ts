// src/modules/blog/posts/services/posts.service.ts

import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  InternalServerErrorException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import {
  AttributeValue,
  DeleteItemCommandInput,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';
import { generatePostId } from '@src/common/generateUUID/generatePostId';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service';
import { CategoryService } from '@src/modules/blog/category/services/category.service';
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service';
import { CommentsService } from '@src/modules/blog/comments/services/comments.service';
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostFullDto } from '@src/modules/blog/posts/dto/post-full.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';

export interface PaginatedPostsResult {
  items: PostSummaryDto[];
  nextKey: string | null;
}

export interface SimpleSuccessMessage {
  message: string;
}

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName: string;
  private readonly CACHE_TTL_POST = 300; // 5 minutos
  private readonly CACHE_KEY_PREFIX_POST = 'post:';
  private readonly CACHE_KEY_PAGINATED_PREFIX = 'posts:paginated:';

  constructor(
    private readonly configService: ConfigService,
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly authorsService: AuthorsService,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
    private readonly commentsService: CommentsService,
  ) {
    this.tableName = this.configService.get<string>('DYNAMO_TABLE_NAME_POSTS') || 'Posts';
  }

  /**
   * @method createPost
   * @description Cria um novo post no sistema
   * @param dto Dados para criação do post
   * @returns PostContentDto com dados do post criado
   */
  async createPost(dto: PostCreateDto): Promise<{ success: boolean; data: PostContentDto }> {
    const postId = generatePostId();
    const now = new Date().toISOString();

    try {
      const postItem = this.buildPostItem(postId, now, dto);
      await this.dynamoDbService.putItem({
        TableName: this.tableName,
        Item: postItem,
      });

      await this.clearPaginatedCache();
      return { success: true, data: this.mapToContentDto(postItem) };
    } catch (error: unknown) {
      this.logger.error(`Falha ao criar post: ${(error as Error).message}`);
      throw new InternalServerErrorException('Erro ao criar post');
    }
  }

  /**
   * @method getPaginatedPosts
   * @description Busca posts paginados com cache
   * @param limit Número máximo de itens por página
   * @param nextKey Chave para paginação (opcional)
   * @returns Resultado paginado de posts
   */
  async getPaginatedPosts(limit: number, nextKey?: string): Promise<{ success: boolean; data: PaginatedPostsResult }> {
    const cacheKey = `${this.CACHE_KEY_PAGINATED_PREFIX}${limit}:${nextKey || 'first'}`;

    try {
      const cached = await this.cacheManager.get<PaginatedPostsResult>(cacheKey);
      if (cached) return { success: true, data: cached };

      const params: QueryCommandInput = {
        TableName: this.tableName,
        Limit: limit,
        ExclusiveStartKey: nextKey ? this.decodeNextKey(nextKey) : undefined,
        ProjectionExpression: 'postId, title, description, publishDate, slug, featuredImageURL, #st, views',
        ExpressionAttributeNames: { '#st': 'status' },
        KeyConditionExpression: '#st = :published', // Filtra por status
        ExpressionAttributeValues: { ':published': { S: 'published' } }, // Garante que o valor não está vazio
      };

      const result = await this.dynamoDbService.query(params);
      const items = result.data.Items?.map(item => this.mapToSummaryDto(item)) || [];
      const newNextKey = result.data.LastEvaluatedKey ? this.encodeNextKey(result.data.LastEvaluatedKey) : null;

      // Salva no cache antes de retornar
      const paginatedResult = { items, nextKey: newNextKey };
      await this.cacheManager.set(cacheKey, paginatedResult, this.CACHE_TTL_POST);

      return { success: true, data: paginatedResult };
    } catch (err) {
      this.logger.error(`Falha na busca paginada: ${(err as Error).message}`);
      throw new InternalServerErrorException('Erro ao buscar posts');
    }
  }

  /**
   * @method getPostBySlug
   * @description Busca um post completo pelo slug com cache
   * @param slug Slug único do post
   * @returns PostFullDto com dados completos enriquecidos
   */
  async getPostBySlug(slug: string): Promise<{ success: boolean; data: PostFullDto }> {
    const cacheKey = `${this.CACHE_KEY_PREFIX_POST}slug:${slug}`;

    try {
      const cached = await this.cacheManager.get<PostFullDto>(cacheKey);
      if (cached) return { success: true, data: cached };

      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'slug-index',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: { ':slug': { S: slug } },
      };

      const result = await this.dynamoDbService.query(params);
      const items = result.data.Items || []; // Acesse `data` antes de `Items`
      if (items.length === 0) {
        throw new NotFoundException(`Post com slug '${slug}' não encontrado.`);
      }
      const enrichedPost = await this.enrichPostData(items[0]);
      return { success: true, data: enrichedPost };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(`Falha ao buscar post por slug: ${(err as Error).message}`);
      throw new InternalServerErrorException('Erro ao buscar post');
    }
  }

  /**
   * @method updatePost
   * @description Atualiza um post existente
   * @param id ID do post a ser atualizado
   * @param dto Dados para atualização
   * @returns PostContentDto atualizado
   */
  async updatePost(id: string, dto: PostUpdateDto): Promise<{ success: boolean; data: PostContentDto }> {
    try {
      const now = new Date().toISOString();
      const updateParams = this.buildUpdateParams(id, dto, now);

      const result = await this.dynamoDbService.updateItem(
        this.tableName,
        { postId: { S: id } }, // Key
        updateParams.ExpressionAttributeValues, // Update data
        'ALL_NEW' // Return values
      );
      const attributes = result.data.Attributes; // Acesse `data` antes de `Attributes`
      if (!attributes) throw new InternalServerErrorException('Falha na atualização');

      await this.clearPostCache();
      await this.clearPaginatedCache();

      return { success: true, data: this.mapToContentDto(attributes) };
    } catch (err) {
      this.handleUpdateError(err as Error, id);
    }
  }

  /**
   * @method deletePost
   * @description Exclui permanentemente um post
   * @param id ID do post a ser excluído
   * @returns Mensagem de sucesso
   */
  async deletePost(id: string): Promise<{ success: boolean; data: SimpleSuccessMessage }> {
    try {
      const params: DeleteItemCommandInput = {
        TableName: this.tableName,
        Key: { postId: { S: id } },
        ConditionExpression: 'attribute_exists(postId)',
      };

      await this.dynamoDbService.deleteItem(params);
      await this.clearPostCache();
      await this.clearPaginatedCache();

      return { success: true, data: { message: 'Post excluído com sucesso' } };
    } catch (err) {
      this.handleDeleteError(err as Error, id);
    }
  }

  // Métodos auxiliares privados

  private buildPostItem(
    postId: string,
    isoDate: string,
    dto: PostCreateDto | PostUpdateDto
  ): Record<string, AttributeValue> {
    return {
      postId: { S: postId },
      publishDate: { S: isoDate },
      modifiedDate: { S: isoDate },
      status: { S: 'draft' },
      views: { N: '0' },
      ...this.mapDtoToDynamoAttributes(dto),
    };
  }

  private mapDtoToDynamoAttributes(dto: PostCreateDto | PostUpdateDto): Record<string, AttributeValue> {
    return {
      ...(dto.title && { title: { S: dto.title } }),
      ...(dto.slug && { slug: { S: dto.slug } }),
      ...(dto.contentHTML && { contentHTML: { S: dto.contentHTML } }),
      ...(dto.description && { description: { S: dto.description } }),
      ...(dto.featuredImageURL && { featuredImageURL: { S: dto.featuredImageURL } }),
      ...(dto.keywords?.length && { keywords: { SS: dto.keywords } }),
      ...(dto.readingTime && { readingTime: { N: dto.readingTime.toString() } }),
      ...(dto.tags?.length && { tags: { SS: dto.tags } }),
      ...(dto.status && { '#status': { S: dto.status } }),
      ...('categoryId' in dto && { categoryId: { S: dto.categoryId } }),
      ...('subcategoryId' in dto && { subcategoryId: { S: dto.subcategoryId } }),
      ...('authorId' in dto && { authorId: { S: dto.authorId } }),
      ...(dto.canonical && { canonical: { S: dto.canonical } }),
    };
  }

  private async enrichPostData(item: Record<string, AttributeValue>): Promise<PostFullDto> {
    const postId = item.postId?.S;
    if (!postId) throw new InternalServerErrorException('Post inválido');

    try {
      const [author, categoryResult, subcategoryResult, comments] = await Promise.all([
        this.authorsService.findOne(item.authorId?.S ?? ''),
        this.categoryService.findOne(item.categoryId?.S ?? ''),
        this.subcategoryService.getSubcategoryById(item.categoryId?.S ?? '', item.subcategoryId?.S ?? ''),
        this.commentsService.findAllByPostId(postId),
      ]);

      const category = categoryResult.data; // Extraia `data` do resultado
      const subcategory = subcategoryResult.data; // Extraia `data` do resultado

      return {
        post: this.mapToContentDto(item),
        author: author || undefined,
        category: category || undefined,
        subcategory: subcategory || undefined,
        comments: comments || [],
        slug: item.slug?.S ?? '',
        canonical: item.canonical?.S ?? '',
        categoryId: item.categoryId?.S ?? '',
        subcategoryId: item.subcategoryId?.S ?? '',
        authorId: item.authorId?.S ?? '',
      };
    } catch (error: unknown) {
      this.logger.error(`Falha no enriquecimento de dados: ${(error as Error).message}`);
      throw new InternalServerErrorException('Erro ao processar post');
    }
  }

  private mapToContentDto(item: Record<string, AttributeValue>): PostContentDto {
    return {
      postId: item.postId?.S ?? '',
      title: item.title?.S,
      contentHTML: item.contentHTML?.S,
      description: item.description?.S,
      canonical: item.canonical?.S,
      featuredImageURL: item.featuredImageURL?.S,
      keywords: item.keywords?.SS,
      readingTime: Number(item.readingTime?.N),
      tags: item.tags?.SS,
      status: item.status?.S ?? '',
      views: Number(item.views?.N),
      categoryId: item.categoryId?.S ?? '',
      subcategoryId: item.subcategoryId?.S ?? '',
      authorId: item.authorId?.S ?? '',
      modifiedDate: item.modifiedDate?.S ?? '',
      publishDate: item.publishDate?.S,
    };
  }

  private mapToSummaryDto(item: Record<string, AttributeValue>): PostSummaryDto {
    return {
      postId: item.postId?.S ?? '',
      title: item.title?.S ?? '',
      description: item.description?.S,
      publishDate: item.publishDate?.S ?? '',
      slug: item.slug?.S ?? '',
      featuredImageURL: item.featuredImageURL?.S,
      status: item.status?.S ?? '',
      views: Number(item.views?.N),
    };
  }

  private buildUpdateParams(
    postId: string,
    dto: PostUpdateDto,
    isoDate: string
  ): {
    UpdateExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, AttributeValue>;
  } {
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, AttributeValue> = {};
    // Removed unused variable 'index'

    const attributes = this.mapDtoToDynamoAttributes(dto);

    for (const key in attributes) {
      if (key === '#status') {
        updateExpressionParts.push(`${key} = :${key.substring(1)}`);
        expressionAttributeNames[key] = 'status';
        expressionAttributeValues[`:${key.substring(1)}`] = attributes[key];
      } else {
        updateExpressionParts.push(`${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = attributes[key];
      }
    }

    updateExpressionParts.push(`modifiedDate = :modifiedDate`);
    expressionAttributeValues[`:modifiedDate`] = { S: isoDate };

    const updateExpression = `SET ${updateExpressionParts.join(', ')}`;

    return {
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    };
  }

  // Métodos de cache
  private async clearPostCache(): Promise<void> {
    const store = (this.cacheManager as Cache & { stores: { keys: () => Promise<Iterable<number>> } }).stores;
    const keys = await store.keys();
    const keysArray = [...keys].map(key => String(key)); // Converte o iterador para um array e depois para strings
    await Promise.all(
      keysArray
        .filter(key => key.startsWith(this.CACHE_KEY_PREFIX_POST))
        .map(key => this.cacheManager.del(key))
    );
  }

  private async clearPaginatedCache(): Promise<void> {
    const store = (this.cacheManager as Cache & { stores: { keys: () => Promise<Iterable<number>> } }).stores;
    const keys = await store.keys();
    const keysArray = [...keys].map(key => String(key)); // Converte o iterador para um array e depois para strings
    await Promise.all(
      keysArray
        .filter(key => key.startsWith(this.CACHE_KEY_PAGINATED_PREFIX))
        .map(key => this.cacheManager.del(key))
    );
  }

  // Métodos de paginação
  private encodeNextKey(key: Record<string, AttributeValue>): string {
    return Buffer.from(JSON.stringify(key)).toString('base64');
  }

  private decodeNextKey(encoded: string): Record<string, AttributeValue> {
    try {
      return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    } catch {
      throw new BadRequestException('Chave de paginação inválida');
    }
  }

  // Tratamento de erros
  private handleUpdateError(error: Error, postId: string): never {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new NotFoundException(`Post ${postId} não encontrado`);
    }
    this.logger.error(`Erro na atualização: ${(error as Error).message}`);
    throw new InternalServerErrorException('Falha na atualização do post');
  }

  private handleDeleteError(error: Error, postId: string): never {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new NotFoundException(`Post ${postId} não encontrado`);
    }
    this.logger.error(`Erro na exclusão: ${(error as Error).message}`);
    throw new InternalServerErrorException('Falha na exclusão do post');
  }
}
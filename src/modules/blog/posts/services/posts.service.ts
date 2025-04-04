import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { PostFullDto } from '@src/modules/blog/posts/dto/post-full.dto';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service';
import { CategoryService } from '@src/modules/blog/category/services/category.service';
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service';
import { CommentsService } from '@src/modules/blog/comments/services/comments.service';
import { generatePostId } from '@src/common/generateUUID/generatePostId';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly authorsService: AuthorsService,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
    private readonly commentsService: CommentsService,
  ) {
    this.tableName = this.configService.get<string>('DYNAMODB_TABLE_NAME_POSTS') || 'Posts';
  }

  /**
   * Cria um novo post no banco de dados
   * @param dto DTO com dados para criação do post
   * @returns PostContentDto com dados do post criado
   * @throws BadRequestException em caso de erro na operação
   */
  async createPost(dto: PostCreateDto): Promise<PostContentDto> {
    try {
      const postId = generatePostId();
      const now = new Date().toISOString();

      const postItem = {
        ...dto,
        postId,
        status: 'draft',
        publishDate: now,
        modifiedDate: now,
        views: 0,
      };

      await this.dynamoDbService.putItem({
        TableName: this.tableName,
        Item: postItem,
      });

      await this.clearPostCache(postId);

      return this.mapToContentDto(postItem);
    } catch (error) {
      this.logError('createPost', error);
      throw new BadRequestException('Erro ao criar post');
    }
  }

  /**
   * Obtém posts paginados ordenados por data de publicação
   * @param limit Número máximo de posts por página
   * @param nextKey Chave de paginação para resultados subsequentes
   * @returns Objeto com dados paginados e metadados
   * @throws BadRequestException em caso de erro na consulta
   */
  async getPaginatedPosts(limit: number, nextKey?: string) {
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'postsByPublishDate-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'published' },
        Limit: limit,
        ExclusiveStartKey: nextKey ? this.decodeNextKey(nextKey) : undefined,
        ScanIndexForward: false,
      };

      const result = await this.dynamoDbService.query(params);

      return {
        data: (result.Items || []).map(this.mapToSummaryDto),
        total: result.Count || 0,
        hasMore: !!result.LastEvaluatedKey,
        nextKey: result.LastEvaluatedKey ? this.encodeNextKey(result.LastEvaluatedKey) : null,
      };
    } catch (error) {
      this.logError('getPaginatedPosts', error);
      throw new BadRequestException('Erro ao buscar posts');
    }
  }

  /**
   * Obtém um post completo pelo slug
   * @param slug Slug único do post
   * @returns PostFullDto com todos os dados relacionados
   * @throws NotFoundException se o post não for encontrado
   * @throws BadRequestException em caso de erro na consulta
   */
  async getPostBySlug(slug: string): Promise<PostFullDto> {
    if (!slug) throw new BadRequestException('Slug não pode estar vazio');

    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'slug-index',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: { ':slug': slug },
      };

      const result = await this.dynamoDbService.query(params);
      const post = result.Items?.[0];

      if (!post) throw new NotFoundException(`Post com slug "${slug}" não encontrado`);

      return this.enrichPostData(post);
    } catch (error) {
      this.logError('getPostBySlug', error);
      throw new BadRequestException('Erro ao buscar post');
    }
  }

  /**
   * Atualiza um post existente
   * @param id ID do post a ser atualizado
   * @param dto DTO com dados para atualização
   * @returns PostContentDto com dados atualizados
   * @throws BadRequestException em caso de erro na operação
   */
  async updatePost(id: string, dto: PostUpdateDto): Promise<PostContentDto> {
    try {
      const updateExpression = [
        'SET title = :title',
        'content = :content',
        'status = :status',
        'modifiedDate = :modifiedDate',
        ...(dto.slug ? ['slug = :slug'] : []),
      ].join(', ');

      const expressionValues = {
        ':title': dto.title,
        ':content': dto.content,
        ':status': dto.status,
        ':modifiedDate': new Date().toISOString(),
        ...(dto.slug && { ':slug': dto.slug }),
      };

      const result = await this.dynamoDbService.updateItem(
        this.tableName,
        { postId: id },
        {
          UpdateExpression: updateExpression,
          ExpressionAttributeValues: expressionValues,
        },
        'ALL_NEW'
      );

      await this.clearPostCache(id);

      return this.mapToContentDto(result.Attributes);
    } catch (error) {
      this.logError('updatePost', error);
      throw new BadRequestException('Erro ao atualizar post');
    }
  }

  /**
   * Remove um post do sistema
   * @param id ID do post a ser removido
   * @returns Mensagem de confirmação
   * @throws BadRequestException em caso de erro na operação
   */
  async deletePost(id: string): Promise<{ message: string }> {
    try {
      await this.dynamoDbService.deleteItem({
        TableName: this.tableName,
        Key: { postId: id },
      });

      await this.clearPostCache(id);

      return { message: 'Post excluído com sucesso' };
    } catch (error) {
      this.logError('deletePost', error);
      throw new BadRequestException('Erro ao excluir post');
    }
  }

  /**
   * Limpa o cache relacionado ao post
   * @param postId ID do post afetado
   */
  private async clearPostCache(postId: string): Promise<void> {
    try {
      await Promise.all([
        this.cacheManager.del(`post:${postId}`),
        this.cacheManager.del('posts:all'),
      ]);
    } catch (cacheError) {
      this.logger.error(`Erro ao limpar cache para post ${postId}`, cacheError);
    }
  }

  /**
   * Decodifica a chave de paginação
   * @param nextKey Chave codificada em base64
   * @returns Objeto decodificado
   */
  private decodeNextKey(nextKey: string): Record<string, any> {
    return JSON.parse(Buffer.from(nextKey, 'base64').toString());
  }

  /**
   * Codifica a chave de paginação
   * @param lastKey Última chave da consulta
   * @returns Chave codificada em base64
   */
  private encodeNextKey(lastKey: Record<string, any>): string {
    return Buffer.from(JSON.stringify(lastKey)).toString('base64');
  }

  /**
   * Enriquece os dados do post com informações relacionadas
   * @param post Dados básicos do post
   * @returns Post completo com dados relacionados
   */
  private async enrichPostData(post: Record<string, any>): Promise<PostFullDto> {
    try {
      const [author, category, subcategory, comments] = await Promise.all([
        this.authorsService.findOne(post.authorId),
        this.categoryService.findOne(post.categoryId),
        this.subcategoryService['findOne'](post.categoryId, post.subcategoryId),
        this.commentsService.findAllByPostId(post.postId),
      ]);

      return {
        post: this.mapToContentDto(post),
        author,
        category,
        subcategory,
        comments,
        slug: post.slug,
      };
    } catch (error) {
      this.logError('enrichPostData', error);
      throw new BadRequestException('Erro ao carregar dados relacionados');
    }
  }

  /**
   * Mapeia dados brutos para PostContentDto
   * @param item Item do DynamoDB
   * @returns DTO formatado
   */
  private mapToContentDto(item: Record<string, any>): PostContentDto {
    return {
      postId: item.postId,
      title: item.title,
      content: item.content,
      status: item.status,
      publishDate: item.publishDate,
      modifiedDate: item.modifiedDate,
      views: item.views || 0,
      slug: item.slug,
      contentHTML: item.contentHTML || '',
      featuredImageURL: item.featuredImageURL || '',
      keywords: item.keywords || [],
      readingTime: item.readingTime || 0,
      tags: item.tags || [],
    };
  }

  /**
   * Mapeia dados brutos para PostSummaryDto
   * @param item Item do DynamoDB
   * @returns DTO resumido
   */
  private mapToSummaryDto(item: Record<string, any>): PostSummaryDto {
    return {
      postId: item.postId,
      title: item.title,
      description: item.description,
      publishDate: item.publishDate,
      slug: item.slug,
      featuredImageURL: item.featuredImageURL,
    };
  }

  /**
   * Registra erros de forma consistente
   * @param method Nome do método onde ocorreu o erro
   * @param error Objeto de erro original
   */
  private logError(method: string, error: Error): void {
    this.logger.error(`[${method}] ${error.message}`, error.stack);
  }
}
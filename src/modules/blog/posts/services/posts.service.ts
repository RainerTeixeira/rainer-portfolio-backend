import { ConfigService } from '@nestjs/config';
import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { QueryCommandInput, AttributeValue, ScanCommandInput } from '@aws-sdk/client-dynamodb';
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
    this.tableName = this.configService.get<string>('DYNAMO_TABLE_NAME_POSTS') || 'Posts';
  }

  /**
   * Cria um novo post no banco de dados.
   * @param dto DTO com dados para criação do post.
   * @returns Retorna o post criado no formato PostContentDto.
   * @throws BadRequestException em caso de erro.
   */
  async createPost(dto: PostCreateDto): Promise<any> {
    try {
      const postId = generatePostId();
      const now = new Date().toISOString();

      // Monta o item a ser salvo no DynamoDB
      const postItem: Record<string, AttributeValue> = {
        postId: { S: postId },
        status: { S: 'draft' },
        publishDate: { S: now },
        modifiedDate: { S: now },
        views: { N: '0' },
        title: dto.title ? { S: dto.title } : { S: '' },
        ...(dto.slug && { slug: { S: dto.slug } }),
        ...(dto.contentHTML && { contentHTML: { S: dto.contentHTML } }),
        ...(dto.featuredImageURL && { featuredImageURL: { S: dto.featuredImageURL } }),
        ...(dto.keywords && { keywords: { SS: dto.keywords } }),
        ...(dto.readingTime && { readingTime: { N: dto.readingTime.toString() } }),
        ...(dto.tags && { tags: { SS: dto.tags } }),
        // Se existir categoria e subcategoria, monta o campo concatenado e os individuais
        ...(dto.categoryId && dto.subcategoryId && {
          'categoryId#subcategoryId': { S: `${dto.categoryId}#${dto.subcategoryId}` },
          categoryId: { S: dto.categoryId },
          subcategoryId: { S: dto.subcategoryId },
        }),
        ...(dto.authorId && { authorId: { S: dto.authorId } }),
        ...(dto.canonical && { canonical: { S: dto.canonical } }),
      };

      // Salva o item no DynamoDB
      await this.dynamoDbService.putItem({
        TableName: this.tableName,
        Item: postItem,
      });

      // Limpa o cache relacionado a este post
      await this.clearPostCache(postId);

      return {
        success: true,
        data: this.mapToContentDto(postItem),
        timestamp: new Date().toISOString(),
        path: '/blog/posts',
      };
    } catch (error) {
      this.logError('createPost', error);
      throw new BadRequestException('Erro ao criar post');
    }
  }

  /**
   * Obtém posts paginados.
   * @param limit Número máximo de posts por página.
   * @param nextKey Chave para paginação.
   * @returns Lista de posts com resumo.
   * @throws BadRequestException em caso de erro na consulta.
   */
  async getPaginatedPosts(limit: number, nextKey?: string): Promise<any> {
    try {
      const params: ScanCommandInput = {
        TableName: this.tableName,
        Limit: limit,
        // Projeta todos os atributos necessários para o resumo
        ProjectionExpression: 'postId, title, description, publishDate, slug, featuredImageURL, status, views',
        ...(nextKey && { ExclusiveStartKey: this.decodeNextKey(nextKey) }),
      };

      const result = await this.dynamoDbService.scan(params);
      const posts = result.Items?.map(item => this.mapToSummaryDto(item)) || [];
      const lastEvaluatedKey = result.LastEvaluatedKey;

      return {
        success: true,
        data: posts,
        nextKey: lastEvaluatedKey ? this.encodeNextKey(lastEvaluatedKey) : null,
        timestamp: new Date().toISOString(),
        path: `/blog/posts?limit=${limit}`,
      };
    } catch (error) {
      this.logError('getPaginatedPosts', error);
      throw new BadRequestException('Erro ao buscar posts paginados');
    }
  }

  /**
   * Obtém um post completo pelo slug.
   * @param slug Slug único do post.
   * @returns Post completo com dados relacionados.
   * @throws NotFoundException se não encontrar o post.
   * @throws BadRequestException em caso de erro na consulta.
   */
  async getPostBySlug(slug: string): Promise<any> {
    if (!slug) throw new BadRequestException('Slug não pode estar vazio');

    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'slug-index',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: {
          ':slug': { S: slug } as AttributeValue
        },
      };

      const result = await this.dynamoDbService.query(params);
      const post = result.Items?.[0];

      if (!post) throw new NotFoundException(`Post com slug "${slug}" não encontrado`);

      return {
        success: true,
        data: await this.enrichPostData(post),
        timestamp: new Date().toISOString(),
        path: `/blog/posts/${slug}`,
      };
    } catch (error) {
      this.logError('getPostBySlug', error);
      throw new BadRequestException('Erro ao buscar post');
    }
  }

  /**
   * Atualiza um post existente.
   * @param id ID do post.
   * @param dto DTO com dados para atualização.
   * @returns Post atualizado.
   * @throws BadRequestException em caso de erro na atualização.
   */
  async updatePost(id: string, dto: PostUpdateDto): Promise<any> {
    try {
      // Monta a expressão de atualização dinamicamente
      const updateExpression = [
        'SET title = :title',
        'status = :status',
        'modifiedDate = :modifiedDate',
        ...(dto.slug ? ['slug = :slug'] : []),
      ].join(', ');

      const expressionValues: Record<string, AttributeValue> = {
        ':title': dto.title ? { S: dto.title } : { S: '' },
        ':status': dto.status ? { S: dto.status } : { S: 'draft' },
        ':modifiedDate': { S: new Date().toISOString() },
        ...(dto.slug && { ':slug': { S: dto.slug } }),
      };

      const result = await this.dynamoDbService.updateItem(
        this.tableName,
        { postId: { S: id } },
        {
          UpdateExpression: updateExpression,
          ExpressionAttributeValues: expressionValues,
        },
        'ALL_NEW'
      );

      if (!result.Attributes) {
        throw new Error('Atributos não retornados na atualização');
      }

      // Limpa o cache do post atualizado
      await this.clearPostCache(id);

      return {
        success: true,
        data: this.mapToContentDto(result.Attributes),
        timestamp: new Date().toISOString(),
        path: `/blog/posts/${id}`,
      };
    } catch (error) {
      this.logError('updatePost', error);
      throw new BadRequestException('Erro ao atualizar post');
    }
  }

  /**
   * Exclui um post do sistema.
   * @param id ID do post.
   * @returns Mensagem de sucesso na exclusão.
   * @throws BadRequestException em caso de erro na exclusão.
   */
  async deletePost(id: string): Promise<any> {
    try {
      await this.dynamoDbService.deleteItem({
        TableName: this.tableName,
        Key: { postId: { S: id } },
      });

      await this.clearPostCache(id);

      return {
        success: true,
        message: 'Post excluído com sucesso',
        timestamp: new Date().toISOString(),
        path: `/blog/posts/${id}`,
      };
    } catch (error) {
      this.logError('deletePost', error);
      throw new BadRequestException('Erro ao excluir post');
    }
  }

  // MÉTODOS AUXILIARES

  /**
   * Limpa o cache relacionado ao post.
   * @param postId ID do post a ser limpo do cache.
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
   * Decodifica a chave de paginação a partir de base64.
   * @param nextKey Chave codificada.
   * @returns Objeto decodificado.
   */
  private decodeNextKey(nextKey: string): Record<string, AttributeValue> {
    return JSON.parse(Buffer.from(nextKey, 'base64').toString());
  }

  /**
   * Codifica a chave de paginação para base64.
   * @param lastKey Última chave da consulta.
   * @returns Chave codificada.
   */
  private encodeNextKey(lastKey: Record<string, AttributeValue>): string {
    return Buffer.from(JSON.stringify(lastKey)).toString('base64');
  }

  /**
   * Enriquece os dados do post com informações relacionadas (autor, categoria, subcategoria e comentários).
   * @param post Dados brutos do post.
   * @returns Post completo com dados relacionados.
   */
  private async enrichPostData(post: Record<string, AttributeValue>): Promise<PostFullDto> {
    try {
      const postId = post.postId?.S || '';
      const authorId = post.authorId?.S || '';
      const categoryId = post.categoryId?.S || '';
      const subcategoryId = post.subcategoryId?.S || '';

      // Executa as consultas em paralelo para otimizar o tempo de resposta
      const [author, category, subcategory, comments] = await Promise.all([
        this.authorsService.findOne(authorId),
        this.categoryService.findOne(categoryId),
        this.subcategoryService.getSubcategoryById(categoryId, subcategoryId),
        this.commentsService.findAllByPostId(postId),
      ]);

      return {
        post: this.mapToContentDto(post),
        author,
        category,
        subcategory,
        comments,
        slug: post.slug?.S || '',
        canonical: post.canonical?.S || '',
        categoryId: post.categoryId?.S || '',
        subcategoryId: post.subcategoryId?.S || '',
        authorId: post.authorId?.S || '',
      };
    } catch (error) {
      this.logError('enrichPostData', error);
      throw new BadRequestException('Erro ao carregar dados relacionados');
    }
  }

  /**
   * Mapeia os dados brutos do DynamoDB para o DTO PostContentDto.
   * @param item Item do DynamoDB.
   * @returns PostContentDto formatado.
   */
  private mapToContentDto(item: Record<string, AttributeValue>): PostContentDto {
    return {
      postId: item.postId?.S || '',
      title: item.title?.S || '',
      status: item.status?.S || 'draft',
      publishDate: item.publishDate?.S || '',
      modifiedDate: item.modifiedDate?.S || '',
      views: item.views ? Number(item.views.N) : 0,
      slug: item.slug?.S || '',
      contentHTML: item.contentHTML?.S || '',
      featuredImageURL: item.featuredImageURL?.S || '',
      keywords: item.keywords?.SS || [],
      readingTime: item.readingTime ? Number(item.readingTime.N) : 0,
      tags: item.tags?.SS || [],
      categoryId: item.categoryId?.S || '',
      subcategoryId: item.subcategoryId?.S || '',
      authorId: item.authorId?.S || '',
      canonical: item.canonical?.S || '',
      // Removido: content: item.content?.S || ''
    };
  }
  
  /**
   * Mapeia os dados brutos do DynamoDB para o DTO PostSummaryDto.
   * @param item Item do DynamoDB.
   * @returns PostSummaryDto formatado.
   */
  private mapToSummaryDto(item: Record<string, AttributeValue>): PostSummaryDto {
    return {
      postId: item.postId?.S || '',
      title: item.title?.S || '',
      description: item.description?.S || '',
      publishDate: item.publishDate?.S || '',
      slug: item.slug?.S || '',
      featuredImageURL: item.featuredImageURL?.S || '',
      status: item.status?.S || '', // Adicionado para incluir o status
      views: item.views ? Number(item.views.N) : 0, // Adicionado para incluir as visualizações
    };
  }


  /**
   * Registra erros de forma consistente no log.
   * @param method Nome do método onde ocorreu o erro.
   * @param error Objeto de erro.
   */
  private logError(method: string, error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;
    this.logger.error(`[${method}] ${errorMessage}`, errorStack);
  }
}

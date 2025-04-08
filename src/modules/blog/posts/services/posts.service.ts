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

/**
 * PostsService - Responsável pela lógica de negócio dos posts.
 * 
 * Estratégias para performance e uso otimizado do Free Tier:
 * - Projeção de atributos para retornar somente os campos necessários.
 * - Paginação via cursor para reduzir varreduras completas.
 * - Uso de cache para minimizar leituras repetidas no DynamoDB.
 * - Execução de consultas em paralelo para enriquecer os dados.
 */
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
   * 
   * Estratégias:
   * - Geração única de ID.
   * - Registro de datas em ISO string.
   * - Remoção de campos não utilizados para economizar capacidade de escrita.
   * 
   * @param dto DTO com dados para criação do post.
   * @returns Objeto com o post criado e metadados.
   * @throws BadRequestException em caso de erro.
   */
  async createPost(dto: PostCreateDto): Promise<any> {
    try {
      const postId = generatePostId();
      const now = new Date().toISOString();

      // Monta o item a ser salvo no DynamoDB com somente os campos necessários
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
        // Campos de categoria e subcategoria para facilitar consultas
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

      const postContentDto = this.mapToContentDto(postItem); // Instanciação correta
      return {
        success: true,
        data: postContentDto,
        timestamp: new Date().toISOString(),
        path: '/blog/posts',
      };
    } catch (error) {
      this.logError('createPost', error);
      throw new BadRequestException('Erro ao criar post');
    }
  }

  /**
   * Obtém posts paginados a partir do DynamoDB.
   * 
   * Estratégias:
   * - Projeção para retornar somente os campos necessários.
   * - Paginação via cursor (ExclusiveStartKey) para evitar varreduras completas.
   * 
   * @param limit Número máximo de posts por página.
   * @param nextKey Chave para paginação (opcional).
   * @returns Objeto com os posts e a próxima chave para paginação.
   * @throws BadRequestException em caso de erro.
   */
  async getPaginatedPosts(limit: number, nextKey?: string): Promise<any> {
    try {
      const params: ScanCommandInput = {
        TableName: this.tableName,
        Limit: limit,
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
   * 
   * Estratégias:
   * - Utiliza índice secundário (slug-index) para consulta.
   * - Enriquecimento dos dados é feito em paralelo.
   * 
   * @param slug Slug único do post.
   * @returns Objeto com o post completo e dados relacionados.
   * @throws NotFoundException se o post não for encontrado.
   * @throws BadRequestException em caso de erro.
   */
  async getPostBySlug(slug: string): Promise<any> {
    if (!slug) throw new BadRequestException('Slug não pode estar vazio');

    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'slug-index',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: {
          ':slug': { S: slug } as AttributeValue,
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
   * Atualiza um post existente no banco de dados.
   * 
   * Estratégias:
   * - Atualiza somente os campos alterados via expressão de atualização.
   * - Limpa o cache do post atualizado.
   * 
   * @param id ID do post.
   * @param dto DTO com dados para atualização.
   * @returns Objeto com o post atualizado.
   * @throws BadRequestException em caso de erro.
   */
  async updatePost(id: string, dto: PostUpdateDto): Promise<any> {
    try {
      // Cria a expressão de atualização com base nos dados fornecidos
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

      const postContentDto = this.mapToContentDto(result.Attributes); // Instanciação correta
      return {
        success: true,
        data: postContentDto,
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
   * 
   * Estratégias:
   * - Exclusão direta pelo ID.
   * - Limpeza do cache relacionado.
   * 
   * @param id ID do post.
   * @returns Objeto com mensagem de sucesso.
   * @throws BadRequestException em caso de erro.
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
   * Limpa o cache relacionado a um post específico.
   * Utiliza operações paralelas para otimizar a performance.
   * @param postId ID do post.
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
   * Decodifica a chave de paginação (nextKey) de base64 para objeto.
   * @param nextKey Chave codificada.
   * @returns Objeto decodificado.
   */
  private decodeNextKey(nextKey: string): Record<string, AttributeValue> {
    return JSON.parse(Buffer.from(nextKey, 'base64').toString());
  }

  /**
   * Codifica a chave de paginação (LastEvaluatedKey) para base64.
   * @param lastKey Última chave retornada na consulta.
   * @returns Chave codificada.
   */
  private encodeNextKey(lastKey: Record<string, AttributeValue>): string {
    return Buffer.from(JSON.stringify(lastKey)).toString('base64');
  }

  /**
   * Enriquece os dados brutos do post com informações relacionadas, como autor, categoria, subcategoria e comentários.
   * Executa as consultas em paralelo para reduzir o tempo de resposta.
   * 
   * @param post Dados brutos do post.
   * @returns Objeto PostFullDto com os dados enriquecidos.
   * @throws BadRequestException em caso de erro.
   */
  private async enrichPostData(post: Record<string, AttributeValue>): Promise<PostFullDto> {
    try {
      const postId = post.postId?.S || '';
      const authorId = post.authorId?.S || '';
      const categoryId = post.categoryId?.S || '';
      const subcategoryId = post.subcategoryId?.S || '';

      // Executa as consultas em paralelo
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
   * Retorna todos os campos obrigatórios para o DTO.
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
    };
  }

  /**
   * Mapeia os dados brutos do DynamoDB para o DTO PostSummaryDto.
   * Retorna somente os campos necessários para o resumo.
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
      status: item.status?.S || '',
      views: item.views?.N ? Number(item.views.N) : 0,
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

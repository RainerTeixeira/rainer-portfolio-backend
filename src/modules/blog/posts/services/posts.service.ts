import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DeleteCommandInput,
  GetCommandInput,
  PutCommandInput,
  QueryCommandInput,
  ScanCommandInput,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { CacheClear } from '@src/common/decorators/cache-clear.decorator';
import { DynamoDbService } from '@src/services/dynamodb.service';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service';
import { CategoryService } from '@src/modules/blog/category/services/category.service';
import { CommentsService } from '@src/modules/blog/comments/services/comments.service';
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service';
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostFullDto } from '@src/modules/blog/posts/dto/post-full.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { CategoryDto } from '@src/modules/blog/categories/dto/category.dto';

@Injectable()
@ApiTags('Posts')
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName = 'Posts';
  private readonly latestPostsCacheKey = 'latest_posts';
  private readonly paginatedPostsCacheKeyPrefix = 'paginated_posts:';
  private readonly FULL_POST_CACHE_TTL = 60 * 60; // 1 hour

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly authorsService: AuthorsService,
    private readonly categoriesService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
    private readonly commentsService: CommentsService,
  ) { }

  /**
   * Cria um novo post no DynamoDB e atualiza os caches relacionados.
   * Utiliza um timestamp em milissegundos convertido para base 36 como ID para economizar espaço.
   *
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado como PostContentDto.
   * @throws BadRequestException se ocorrer um erro durante a criação do post.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  @ApiOperation({ summary: 'Cria um novo post' })
  @ApiResponse({ status: 201, description: 'Post criado com sucesso.', type: PostContentDto })
  @ApiResponse({ status: 400, description: 'Falha ao criar post.' })
  async createPost(createPostDto: PostCreateDto): Promise<PostContentDto> {
    this.logger.debug(`[createPost] Iniciando criação do post com dados: ${JSON.stringify(createPostDto)}`);
    try {
      const compositeKey = `${createPostDto.categoryId}#${createPostDto.subcategoryId}`;
      const postId = Date.now().toString(36);
      const publishDate = new Date().toISOString();
      const postItem = {
        'categoryId#subcategoryId': compositeKey,
        postId,
        publishDate,
        modifiedDate: new Date().toISOString(),
        views: 0,
        status: 'draft',
        ...this.sanitizePostData(createPostDto),
      };
      const params: PutCommandInput = { TableName: this.tableName, Item: postItem };
      this.logger.debug(`[createPost] Parâmetros para inserção no DynamoDB: ${JSON.stringify(params)}`);
      const result = await this.dynamoDbService.putItem(params);
      this.logger.debug(`[createPost] Resultado da inserção no DynamoDB: ${JSON.stringify(result)}`);
      await this.refreshRelatedCaches(compositeKey, postId);
      this.logger.verbose(`[createPost] Post criado com sucesso, ID: ${postId}`);
      return this.mapToContentDto(postItem);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[createPost] Erro na criação do post: ${errorMessage}`, error?.stack);
      throw new BadRequestException(`Falha ao criar post: ${errorMessage}`);
    } finally {
      this.logger.debug('[createPost] Finalizando criação do post.');
    }
  }

  /**
   * Retorna uma listagem paginada de posts.
   *
   * @param page - Número da página a ser retornada.
   * @param limit - Número máximo de posts por página.
   * @param nextKey - Token de paginação opcional fornecido pela resposta anterior.
   * @returns Objeto contendo a lista de posts, o total de posts, uma mensagem opcional e um indicador se há mais posts.
   * @throws BadRequestException se ocorrer um erro durante a listagem dos posts.
   */
  @ApiOperation({ summary: 'Retorna uma listagem paginada de posts' })
  @ApiResponse({ status: 200, description: 'Listagem de posts retornada com sucesso.', type: [PostSummaryDto] })
  @ApiResponse({ status: 400, description: 'Falha ao listar posts paginados.' })
  async getPaginatedPosts(
    page: number,
    limit: number,
    nextKey?: string,
  ): Promise<{
    data: PostSummaryDto;
    total: number;
    message?: string;
    hasMore: boolean;
    nextKey?: string;
  }> {
    this.logger.debug(`[getPaginatedPosts] Iniciando consulta paginada: Página ${page}, Limite ${limit}, NextKey: ${nextKey}`);
    try {
      const cacheKey = `${this.paginatedPostsCacheKeyPrefix}page:${page}_limit:${limit}_nextKey:${nextKey}`;
      const parsedNextKey = nextKey ? JSON.parse(Buffer.from(nextKey, 'base64').toString('ascii')) : undefined;
      this.logger.debug(`[getPaginatedPosts] Chave do cache: ${cacheKey}`);
      const result = await this.getCachedOrQuery(
        cacheKey,
        () => this.queryPaginatedPostsFromDb(page, limit, parsedNextKey),
        300, // Cache por 5 minutos
      );

      const response = {
        data: result.data,
        total: result.total,
        hasMore: result.hasMore,
        nextKey: result.lastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64')
          : undefined,
        message: undefined,
      };

      if (!response.hasMore && response.data.length === 0 && page > 1) {
        response.message = 'Não há mais posts a exibir.';
      } else if (!response.hasMore && response.data.length > 0) {
        response.message = 'Todos os posts foram carregados.';
      } else if (!response.hasMore && page === 1 && response.data.length === 0) {
        response.message = 'Nenhum post encontrado.';
      }

      this.logger.debug(`[getPaginatedPosts] Resposta da consulta paginada: ${JSON.stringify(response)}`);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[getPaginatedPosts] Erro ao listar posts paginados: ${errorMessage}`, error?.stack);
      throw new BadRequestException(`Falha ao listar posts paginados: ${errorMessage}`);
    } finally {
      this.logger.debug('[getPaginatedPosts] Finalizando consulta paginada.');
    }
  }

  /**
   * Retorna um post completo com base no slug, incluindo todas as entidades relacionadas.
   * Utiliza cache para melhorar performance e reduzir chamadas ao DynamoDB.
   *
   * @param slug - Slug do post a ser buscado
   * @returns PostFullDto com todas as informações relacionadas
   * @throws NotFoundException se o post não for encontrado
   * @throws BadRequestException se ocorrer erro ao buscar dados
   */
  @ApiOperation({
    summary: 'Retorna um post completo com base no slug',
    description:
      'Retorna o post completo incluindo informações do autor, categoria, subcategoria e comentários associados.',
  })
  @ApiResponse({
    status: 200,
    description: 'Post completo retornado com sucesso.',
    type: PostFullDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado.',
  })
  async getFullPostBySlug(slug: string): Promise<any> {
    const cacheKey = `full-post:${slug}`;

    try {
      // Verificar cache
      const cached = await this.cacheManager.get<PostFullDto>(cacheKey);
      if (cached) {
        return cached;
      }

      // Buscar post principal
      const post = await this.getPostBySlugFromDB(slug);
      if (!post) {
        throw new NotFoundException(`Post com slug '${slug}' não encontrado`);
      }

      if (!post.authorId) {
        throw new BadRequestException('authorId não fornecido');
      }

      // Buscar dados relacionados em paralelo
      let author, category, subcategory, comments;
      try {
        [author, category, subcategory, comments] = await Promise.all([
          this.authorsService.getAuthorById(post.authorId),
          this.categoriesService.getCategoryById(post.categoryId),
          this.subcategoryService.getSubcategoryById(post.categoryId, post.subcategoryId),
          this.commentsService.getCommentsByPostId(post.postId),
        ]);
      } catch (error) {
        this.logger.error(`Erro ao buscar dados relacionados: ${error.message}`, error.stack);
        throw new BadRequestException(`Erro ao buscar dados relacionados: ${error.message}`);
      }

      // Montar objeto completo no formato desejado
      const fullPost = this.mapToFullPostDto(post, author, category, subcategory, comments);

      // Armazenar em cache
      await this.cacheManager.set(cacheKey, fullPost, this.FULL_POST_CACHE_TTL * 1000);

      return fullPost;
    } catch (error) {
      this.logger.error(`Erro ao buscar post completo: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar post completo');
    }
  }

  /**
   * Atualiza um post existente no DynamoDB.
   *
   * @param postId - Identificador do post.
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado como PostContentDto.
   * @throws BadRequestException se ocorrer um erro durante a atualização do post.
   * @throws NotFoundException se o post não for encontrado.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  @ApiOperation({ summary: 'Atualiza um post existente' })
  @ApiResponse({ status: 200, description: 'Post atualizado com sucesso.', type: PostContentDto })
  @ApiResponse({ status: 400, description: 'Falha ao atualizar post.' })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async updatePost(postId: string, updatePostDto: PostUpdateDto): Promise<PostContentDto> {
    this.logger.debug(
      `[updatePost] Iniciando atualização do post ID: ${postId} com dados: ${JSON.stringify(updatePostDto)}`,
    );
    try {
      this.logger.debug(`[updatePost] Buscando post existente com ID: ${postId}`);
      const existingPost = await this.getPostById(postId);
      this.logger.debug(`[updatePost] Post existente encontrado: ${JSON.stringify(existingPost)}`);
      const compositeKey = `${existingPost.categoryId}#${existingPost.subcategoryId}`;
      this.logger.debug(`[updatePost] Chave composta do post a ser atualizado: ${compositeKey}`);
      this.logger.debug(`[updatePost] Dados para atualização (updatePostDto): ${JSON.stringify(updatePostDto)}`);
      this.logger.debug(`[updatePost] Construindo expressão de atualização para o post ID: ${postId}`);

      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': compositeKey,
          postId: postId,
        },
        ReturnValues: 'ALL_NEW',
      };

      try {
        this.logger.debug(`[updatePost] Parâmetros para atualização no DynamoDB: ${JSON.stringify(params)}`);
        this.logger.debug(`[updatePost] Enviando solicitação de atualização para o DynamoDB para o post ID: ${postId}`);
        this.logger.debug(`[updatePost] Parâmetros para dynamoDbService.updateItem: ${JSON.stringify(params)}`);
        const result = await this.dynamoDbService.updateItem(this.tableName, { 'categoryId#subcategoryId': compositeKey, postId: postId }, updatePostDto);
        this.logger.debug(`[updatePost] Resultado da atualização no DynamoDB: ${JSON.stringify(result)}`);
        this.logger.debug(`[updatePost] Atributos retornados após a atualização: ${JSON.stringify(result.Attributes)}`);
        this.logger.debug(`[updatePost] Atualizando caches relacionados ao post ID: ${postId}`);
        await this.refreshRelatedCaches(compositeKey, postId);
        this.logger.verbose(`[updatePost] Post atualizado com sucesso, ID: ${postId}`);
        return this.mapToContentDto(result.Attributes);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        this.logger.error(`[updatePost] Erro na atualização do post ID: ${postId}: ${errorMessage}`, error?.stack);
        throw new BadRequestException(`Falha ao atualizar post: ${errorMessage}`);
      } finally {
        this.logger.debug('[updatePost] Finalizando atualização do post.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[updatePost] Erro na atualização do post ID: ${postId}: ${errorMessage}`, error?.stack);
      throw new BadRequestException(`Falha ao atualizar post: ${errorMessage}`);
    } finally {
      this.logger.debug('[updatePost] Finalizando atualização do post.');
    }
  }

  /**
   * Deleta um post do DynamoDB.
   **
   * @param postId - Identificador do post.
   * @throws BadRequestException se ocorrer um erro durante a Exclusão do post.
   * @throws NotFoundException se o post não for encontrado.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  @ApiOperation({ summary: 'Deleta um post' })
  @ApiResponse({ status: 200, description: 'Post deletado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Falha ao remover post.' })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async deletePost(id: string): Promise<void> {
    this.logger.debug(`[deletePost] Iniciando Exclusão do post ID: ${id}`);
    try {
      // Buscar o post pelo ID para obter categoryId e subcategoryId
      const post = await this.getPostById(id);
      if (!post) {
        throw new NotFoundException(`Post com ID ${id} não encontrado`);
      }
      // Construir a chave completa para a operação deleteItem
      const key = {
        'categoryId#subcategoryId': `${post.categoryId}#${post.subcategoryId}`,
        postId: id,
      };
      this.logger.log(
        `[DynamoDbService] deleteItem: Iniciando operação deleteItem com params: ${JSON.stringify(
          key,
        )}`,
      );
      // Excluir o post usando a chave completa
      await this.dynamoDbService.deleteItem({
        TableName: this.tableName,
        Key: key,
      });
      this.logger.debug(`[deletePost] Post ID: ${id} excluído com sucesso.`);
    } catch (error) {
      this.logger.error(`Erro ao excluir post ID: ${id}`, error);
      throw new Error(`Erro ao excluir post: ${error.message}`);
    }
  }

  // ────────────────────────── Métodos Auxiliares ──────────────────────────

  /**
   * Executa uma consulta de paginação de posts no DynamoDB.
   **
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @param lastEvaluatedKey - Chave para iniciar a próxima página (opcional).
   * @returns Objeto contendo os dados paginados, o total de posts (aproximado) e um indicador se há mais posts.
   */
  private async queryPaginatedPostsFromDb(
    page: number,
    limit: number,
    lastEvaluatedKey?: Record<string, AttributeValue>,
  ): Promise<{
    data: PostSummaryDto;
    total: number;
    message?: string;
    hasMore: boolean;
    lastEvaluatedKey?: Record<string, AttributeValue>;
  }> {
    this.logger.debug(
      `[queryPaginatedPostsFromDb] Iniciando consulta paginada: Página ${page}, Limite ${limit}, LastEvaluatedKey: ${JSON.stringify(
        lastEvaluatedKey,
      )}`,
    );
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'postsByPublishDate-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status', '#views': 'views' },
        ExpressionAttributeValues: { ':status': 'published' },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
        ProjectionExpression: [
          'postId',
          'title',
          'contentHTML',
          'authorId',
          'categoryId',
          'subcategoryId',
          'slug',
          'featuredImageURL',
          'description',
          'publishDate',
          'modifiedDate',
          'readingTime',
          '#views',
          'tags',
          'keywords',
          'canonical',
          '#status',
        ].join(', '),
      };
      this.logger.debug(
        `[queryPaginatedPostsFromDb] Parâmetros para consulta paginada no DynamoDB: ${JSON.stringify(params)}`,
      );
      const result = await this.dynamoDbService.query(params);
      this.logger.debug(
        `[queryPaginatedPostsFromDb] Resultado da consulta paginada no DynamoDB: ${JSON.stringify(result)}`,
      );
      const items = result.Items || [];
      const data = items.map((item) => this.mapToSummaryDto(item));
      this.logger.verbose(`[queryPaginatedPostsFromDb] Consulta paginada concluída. Itens na página: ${data.length}`);
      return {
        data,
        total: -1,
        hasMore: !!result.LastEvaluatedKey,
        lastEvaluatedKey: result.LastEvaluatedKey,
      };
    } catch (error) {
      this.logger.error(`[queryPaginatedPostsFromDb] Erro na consulta paginada: ${error?.message}`, error?.stack);
      throw error; // Re-lançar o erro para ser capturado no método pai
    } finally {
      this.logger.debug('[queryPaginatedPostsFromDb] Finalizando consulta paginada do banco.');
    }
  }

  /**
   * Busca um post pelo seu ID no DynamoDB.
   **
   * @param postId - Identificador único do post.
   * @returns O post encontrado como PostContentDto.
   * @throws NotFoundException se o post não for encontrado.
   * @throws BadRequestException se ocorrer um erro ao buscar o post.
   */
  @ApiOperation({ summary: 'Busca um post pelo seu ID' })
  @ApiResponse({ status: 200, description: 'Post retornado com sucesso.', type: PostContentDto })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async getPostById(postId: string): Promise<PostContentDto> {
    this.logger.debug(`[getPostById] Iniciando busca de post pelo ID: ${postId}`);
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'postId-index', // índice no DynamoDB
        KeyConditionExpression: 'postId = :postId',
        ExpressionAttributeValues: { ':postId': postId }, // Corrigir o formato do valor
        Limit: 1,
        ProjectionExpression: [
          'postId',
          'title',
          'contentHTML',
          'authorId',
          'categoryId',
          'subcategoryId',
          'slug',
          'featuredImageURL',
          'description',
          'publishDate',
          'modifiedDate',
          'readingTime',
          '#views',
          'tags',
          'keywords',
          'canonical',
          '#status',
        ].join(', '),
        ExpressionAttributeNames: { '#views': 'views', '#status': 'status' },
      };
      this.logger.debug(`[getPostById] Parâmetros para consulta por ID no DynamoDB: ${JSON.stringify(params)}`);
      const result = await this.dynamoDbService.query(params);
      this.logger.debug(`[getPostById] Resultado da consulta por ID no DynamoDB: ${JSON.stringify(result)}`);
      if (!result.Items || result.Items.length === 0) {
        this.logger.warn(`[getPostById] Post não encontrado para ID: ${postId}`);
        throw new NotFoundException('Post não encontrado');
      }
      const post = this.mapToContentDto(result.Items[0]);
      this.logger.debug(`[getPostById] Post encontrado: ${JSON.stringify(post)}`);
      return post;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[getPostById] Erro ao buscar post por ID: ${errorMessage}`, error?.stack);
      throw new NotFoundException(`Post não encontrado: ${errorMessage}`);
    } finally {
      this.logger.debug('[getPostById] Finalizando busca de post por ID.');
    }
  }

  /**
   * Mapeia um item do DynamoDB para o DTO de resumo do post.
   **
   * @param item - Item retornado do banco.
   * @returns Objeto do tipo PostSummaryDto.
   */
  private mapToSummaryDto(item: any): PostSummaryDto {
    this.logger.debug(`[mapToSummaryDto] Mapeando item para Summary DTO: ${JSON.stringify(item)}`);
    return {
      title: item.title,
      featuredImageURL: item.featuredImageURL,
      description: item.description,
      slug: item.slug
    } as PostSummaryDto;
  }

  /**
   * Mapeia os dados do post e suas entidades relacionadas para o formato desejado.
   **
   * @param post - Dados do post.
   * @param author - Dados do autor.
   * @param category - Dados da categoria.
   * @param subcategory - Dados da subcategoria.
   * @param comments - Lista de comentários.
   * @returns Objeto formatado com todas as informações relacionadas ao post.
   */
  private mapToFullPostDto(
    post: any,
    author: any,
    category: any,
    subcategory: any,
    comments: any[],
  ): any {
    return {
      post: {
        readingTime: post.readingTime,
        status: post.status,
        slug: post.slug,
        views: post.views,
        modifiedDate: post.modifiedDate,
        canonical: post.canonical,
        contentHTML: post.contentHTML,
        publishDate: post.publishDate,
        description: post.description,
        title: post.title,
        featuredImageURL: post.featuredImageURL,
      },
      author: {
        name: author.name,
      },
      category: {
        name: category.name,
      },
      subcategory: {
        name: subcategory.name,
      },
      comments: comments.map(comment => ({
        content: comment.content,
        date: comment.date,
        status: comment.status,
      })),
    };
  }

  /**
   * Mapeia um item do DynamoDB para o DTO de conteúdo do post.
   * usado para fazer mapeamento de dados do banco ao excluir pelo ID
   * Mapeia um item do DynamoDB para o DTO de conteúdo do post.
   * @param item - Item retornado do banco.
   * @returns Objeto do tipo PostContentDto.
   */
  private mapToContentDto(item: any): PostContentDto {
    this.logger.debug(`[mapToContentDto] Mapeando item para Content DTO: ${JSON.stringify(item)}`);
    return {
      postId: item.postId,
      title: item.title,
      contentHTML: item.contentHTML,
      authorId: item.authorId,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      slug: item.slug,
      featuredImageURL: item.featuredImageURL,
      description: item.description,
      publishDate: item.publishDate,
      modifiedDate: item.modifiedDate,
      readingTime: item.readingTime,
      views: item.views,
      tags: item.tags,
      keywords: item.keywords,
      canonical: item.canonical,
      status: item.status,
    } as PostContentDto;
  }

  /**
   * Sanitiza os dados do post, removendo campos que não devem ser enviados ao banco.
   **
   * @param postData - Dados do post.
   * @returns Objeto com os dados sanitizados.
   */
  private sanitizePostData(postData: PostCreateDto | PostUpdateDto): any {
    this.logger.debug(`[sanitizePostData] Sanitizando dados: ${JSON.stringify(postData)}`);
    const sanitizedData = { ...postData };
    delete sanitizedData.postId;
    delete sanitizedData.categoryIdSubcategoryId;
    this.logger.debug(`[sanitizePostData] Dados sanitizados: ${JSON.stringify(sanitizedData)}`);
    return sanitizedData;
  }

  /**
   * Recupera dados do cache ou executa a consulta e armazena o resultado.
   **
   * @param cacheKey - Chave do cache.
   * @param queryFn - Função que executa a consulta.
   * @param ttl - Tempo de vida do cache (em segundos).
   * @returns Dados obtidos do cache ou da consulta.
   */
  private async getCachedOrQuery(
    cacheKey: string,
    queryFn: () => Promise<any>,
    ttl: number,
  ): Promise<any> {
    this.logger.debug(`[getCachedOrQuery] Verificando cache para chave: ${cacheKey}`);
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`[getCachedOrQuery] Cache hit para a chave: ${cacheKey}`);
      return cached;
    }
    this.logger.debug(`[getCachedOrQuery] Cache miss para a chave: ${cacheKey}. Executando consulta.`);
    try {
      const result = await queryFn();
      await this.cacheManager.set(cacheKey, result, ttl);
      this.logger.debug(`[getCachedOrQuery] Resultado da consulta e armazenado em cache para a chave: ${cacheKey}`);
      return result;
    } catch (error) {
      this.logger.error(
        `[getCachedOrQuery] Erro ao executar a consulta para a chave: ${cacheKey}: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Atualiza os caches relacionados a um post, removendo chaves antigas.
   **
   * @param compositeKey - Chave composta no formato "categoria#subcategoria".
   * @param postId - Identificador do post.
   */
  private async refreshRelatedCaches(compositeKey: string, postId: string): Promise<void> {
    this.logger.debug(`[refreshRelatedCaches] Atualizando caches relacionados ao post ID: ${postId}`);
    try {
      // Limpar caches diretos
      await Promise.all([
        this.cacheManager.del(`post_${postId}`),
        this.cacheManager.del(`category_${compositeKey}`),
        this.cacheManager.del(this.latestPostsCacheKey),
      ]);
      this.logger.debug(`[refreshRelatedCaches] Caches principais removidos`);

      // Limpar caches paginados de forma segmentada
      const MAX_PAGINATED_PAGES = 5; // Ajuste conforme necessidade
      const deletionPromises = [];
      for (let page = 1; page <= MAX_PAGINATED_PAGES; page++) {
        for (const limit of [5, 10, 20]) {
          // Limites comuns
          const cacheKey = `${this.paginatedPostsCacheKeyPrefix}page:${page}_limit:${limit}`;
          deletionPromises.push(this.cacheManager.del(cacheKey));
        }
      }
      await Promise.all(deletionPromises);
      this.logger.debug(`[refreshRelatedCaches] Caches paginados removidos`);
    } catch (error) {
      this.logger.error(`[refreshRelatedCaches] Erro ao atualizar caches: ${error.message}`, error.stack);
      throw new Error(`Falha ao atualizar caches: ${error.message}`);
    }
  }

  /**
   * Busca um post pelo seu slug no DynamoDB.
   * @param slug - O slug do post a ser buscado.
   * @returns O post encontrado como objeto do DynamoDB.
   * @throws Error se o post não for encontrado.
   */
  async getPostBySlugFromDB(slug: string): Promise<any> {
    const params: QueryCommandInput = {
      TableName: 'Posts',
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: {
        ':slug': slug,
      },
    };
    try {
      const result = await this.dynamoDbService.query(params);
      if (!result.Items || result.Items.length === 0) {
        throw new Error('Post não encontrado');
      }
      return result.Items[0];
    } catch (error) {
      throw new Error(`Erro ao buscar post pelo slug: ${error.message}`);
    }
  }


}
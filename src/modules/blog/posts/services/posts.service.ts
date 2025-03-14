import { Injectable, NotFoundException, BadRequestException, Logger, Inject, } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DynamoDbService } from '@src/services/dynamodb.service';
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { GetCommandInput, PutCommandInput, QueryCommandInput, UpdateCommandInput, DeleteCommandInput, ScanCommandInput, } from '@aws-sdk/lib-dynamodb';
import { CacheClear } from '@src/common/decorators/cache-clear.decorator.ts';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Injectable()
@ApiTags('Posts')
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
      const postId = new Date().getTime().toString(36);
      const publishDate = new Date().toISOString();
      const postItem = { 'categoryId#subcategoryId': compositeKey, postId, publishDate, modifiedDate: new Date().toISOString(), views: 0, status: 'draft', ...this.sanitizePostData(createPostDto), };
      const params: PutCommandInput = { TableName: this.tableName, Item: postItem, };
      this.logger.debug(`[createPost] Parâmetros para inserção no DynamoDB: ${JSON.stringify(params)}`);
      const result = await this.dynamoDbService.putItem(params);
      this.logger.debug(`[createPost] Resultado da inserção no DynamoDB: ${JSON.stringify(result)}`);
      await this.refreshRelatedCaches(compositeKey, postId);
      this.logger.verbose(`[createPost] Post criado com sucesso, ID: ${postId}`);
      return this.mapToContentDto(postItem);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[createPost] Erro na criação do post: ${errorMsg}`, error?.stack);
      throw new BadRequestException(`Falha ao criar post: ${errorMsg}`);
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
  ): Promise<{ data: PostSummaryDto; total: number; message?: string; hasMore: boolean; nextKey?: string }> {
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
      const response = { data: result.data, total: result.total, hasMore: result.hasMore, nextKey: result.lastEvaluatedKey ? Buffer.from(JSON.stringify(result.lastEvaluatedKey)).toString('base64') : undefined, message: undefined, };
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
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[getPaginatedPosts] Erro ao listar posts paginados: ${errorMsg}`, error?.stack);
      throw new BadRequestException(`Falha ao listar posts paginados: ${errorMsg}`);
    } finally {
      this.logger.debug('[getPaginatedPosts] Finalizando consulta paginada.');
    }
  }

  /**
   * Retorna um post completo com base no slug.
   *
   * @param slug - Slug do post.
   * @returns O post completo como PostContentDto ou null se não encontrado.
   * @throws BadRequestException se ocorrer um erro durante a busca do post.
   */
  @ApiOperation({ summary: 'Retorna um post completo com base no slug' })
  @ApiResponse({ status: 200, description: 'Post retornado com sucesso.', type: PostContentDto })
  @ApiResponse({ status: 400, description: 'Falha ao buscar post por slug.' })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async getPostBySlug(slug: string): Promise<PostContentDto | null> {
    this.logger.debug(`[getPostBySlug] Iniciando busca de post pelo slug: ${slug}`);
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'slug-index', // Nome do GSI para buscar por slug
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: { ':slug': slug, },
        Limit: 1,
      };
      this.logger.debug(`[getPostBySlug] Parâmetros para consulta por slug no DynamoDB: ${JSON.stringify(params)}`);
      const result = await this.dynamoDbService.query(params);
      this.logger.debug(`[getPostBySlug] Resultado da consulta por slug no DynamoDB: ${JSON.stringify(result)}`);
      if (result.Items && result.Items.length > 0) {
        const post = this.mapDynamoDBItemToPostContentDto(result.Items[0]);
        this.logger.debug(`[getPostBySlug] Post encontrado: ${JSON.stringify(post)}`);
        return post;
      } else {
        this.logger.log(`[getPostBySlug] Post com slug '${slug}' não encontrado.`);
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[getPostBySlug] Erro ao buscar post por slug '${slug}' no DynamoDB: ${errorMsg}`, error?.stack);
      throw new BadRequestException(`Falha ao buscar post por slug: ${errorMsg}`);
    } finally {
      this.logger.debug('[getPostBySlug] Finalizando busca de post por slug.');
    }
  }

  /**
   * Busca um post pelo seu ID no DynamoDB.
   *
   * @param postId - Identificador único do post.
   * @returns O post encontrado como PostContentDto.
   * @throws NotFoundException se o post não for encontrado.
   * @throws BadRequestException se ocorrer um erro ao buscar o post.
   */
  @ApiOperation({ summary: 'Busca um post pelo seu ID' })
  @ApiResponse({ status: 200, description: 'Post retornado com sucesso.', type: PostContentDto })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async getPostById(postId: string): Promise<any> {
    this.logger.debug(`[getPostById] Iniciando busca de post pelo ID: ${postId}`);
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'postId-index',
        KeyConditionExpression: 'postId = :postId',
        ExpressionAttributeValues: { ':postId': postId, },
        Limit: 1,
      };
      this.logger.debug(`[getPostById] Parâmetros para consulta por ID no DynamoDB: ${JSON.stringify(params)}`);
      const result = await this.dynamoDbService.query(params);
      this.logger.debug(`[getPostById] Resultado da consulta por ID no DynamoDB: ${JSON.stringify(result)}`);
      if (!result.Items || result.Items.length === 0) {
        this.logger.warn(`[getPostById] Post não encontrado para ID: ${postId}`);
        throw new NotFoundException('Post não encontrado');
      }
      const post = this.mapToDetailDto(result.Items[0]);
      this.logger.debug(`[getPostById] Post encontrado: ${JSON.stringify(post)}`);
      return post;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[getPostById] Erro ao buscar post por ID: ${errorMsg}`, error?.stack);
      throw new NotFoundException(`Post não encontrado: ${errorMsg}`);
    } finally {
      this.logger.debug('[getPostById] Finalizando busca de post por ID.');
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
    this.logger.debug(`[updatePost] Iniciando atualização do post ID: ${postId} com dados: ${JSON.stringify(updatePostDto)}`);
    try {
      this.logger.debug(`[updatePost] Buscando post existente com ID: ${postId}`);
      const existingPost = await this.getPostById(postId);
      this.logger.debug(`[updatePost] Post existente encontrado: ${JSON.stringify(existingPost)}`);
      const compositeKey = existingPost['categoryId#subcategoryId'];
      this.logger.debug(`[updatePost] Chave composta do post a ser atualizado: ${compositeKey}`);
      this.logger.debug(`[updatePost] Dados para atualização (updatePostDto): ${JSON.stringify(updatePostDto)}`);
      this.logger.debug(`[updatePost] Construindo expressão de atualização para o post ID: ${postId}`);
      const updateExpression = this.buildUpdateExpression(updatePostDto);
      this.logger.debug(`[updatePost] Expressão de atualização construída: ${updateExpression}`);
      this.logger.debug(`[updatePost] Gerando ExpressionAttributeNames para o post ID: ${postId}`);
      const expressionAttributeNames = this.getUpdateExpressionAttributeNames(updatePostDto);
      this.logger.debug(`[updatePost] ExpressionAttributeNames gerados: ${JSON.stringify(expressionAttributeNames)}`);
      this.logger.debug(`[updatePost] Gerando ExpressionAttributeValues para o post ID: ${postId}`);
      const expressionAttributeValues = this.getUpdateExpressionAttributeValues(updatePostDto);
      this.logger.debug(`[updatePost] ExpressionAttributeValues gerados: ${JSON.stringify(expressionAttributeValues)}`);
      this.logger.debug(`[updatePost] Construindo parâmetros de atualização para o post ID: ${postId}`);
      const updateParams: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': compositeKey,
          postId: postId,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      };
      this.logger.debug(`[updatePost] Parâmetros para atualização no DynamoDB: ${JSON.stringify(updateParams)}`);
      this.logger.debug(`[updatePost] Enviando solicitação de atualização para o DynamoDB para o post ID: ${postId}`);
      const result = await this.dynamoDbService.updateItem(updateParams);
      this.logger.debug(`[updatePost] Resultado da atualização no DynamoDB: ${JSON.stringify(result)}`);
      this.logger.debug(`[updatePost] Atributos retornados após a atualização: ${JSON.stringify(result.Attributes)}`);
      this.logger.debug(`[updatePost] Atualizando caches relacionados ao post ID: ${postId}`);
      await this.refreshRelatedCaches(compositeKey, postId);
      this.logger.verbose(`[updatePost] Post atualizado com sucesso, ID: ${postId}`);
      return this.mapToContentDto(result.Attributes);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[updatePost] Erro na atualização do post ID: ${postId}: ${errorMsg}`, error?.stack);
      throw new BadRequestException(`Falha ao atualizar post: ${errorMsg}`);
    } finally {
      this.logger.debug('[updatePost] Finalizando atualização do post.');
    }
  }

  /**
   * Deleta um post do DynamoDB.
   *
   * @param postId - Identificador do post.
   * @throws BadRequestException se ocorrer um erro durante a Exclusão do post.
   * @throws NotFoundException se o post não for encontrado.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  @ApiOperation({ summary: 'Deleta um post' })
  @ApiResponse({ status: 200, description: 'Post deletado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Falha ao remover post.' })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async deletePost(postId: string): Promise<void> {
    this.logger.debug(`[deletePost] Iniciando Exclusão do post ID: ${postId}`);
    try {
      const post = await this.getPostById(postId);
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': post['categoryId#subcategoryId'],
          postId: postId,
        },
      };
      this.logger.debug(`[deletePost] Parâmetros para Exclusão no DynamoDB: ${JSON.stringify(params)}`);
      const result = await this.dynamoDbService.deleteItem(params);
      this.logger.debug(`[deletePost] Resultado da Exclusão no DynamoDB: ${JSON.stringify(result)}`);
      await this.refreshRelatedCaches(post['categoryId#subcategoryId'], postId);
      this.logger.verbose(`[deletePost] Post deletado com sucesso, ID: ${postId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`[deletePost] Erro na Exclusão do post: ${errorMsg}`, error?.stack);
      throw new BadRequestException(`Falha ao remover post: ${errorMsg}`);
    } finally {
      this.logger.debug('[deletePost] Finalizando Exclusão do post.');
    }
  }

  // ────────────────────────── Métodos Auxiliares ──────────────────────────

  /**
   * Executa uma consulta de paginação de posts no DynamoDB.
   *
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @param lastEvaluatedKey - Chave para iniciar a próxima página (opcional).
   * @returns Objeto contendo os dados paginados, o total de posts (aproximado) e um indicador se há mais posts.
   */
  private async queryPaginatedPostsFromDb(
    page: number,
    limit: number,
    lastEvaluatedKey?: Record<string, AttributeValue>,
  ): Promise<{ data: PostSummaryDto; total: number; message?: string; hasMore: boolean; lastEvaluatedKey?: Record<string, AttributeValue> }> {
    this.logger.debug(`[queryPaginatedPostsFromDb] Iniciando consulta paginada: Página ${page}, Limite ${limit}, LastEvaluatedKey: ${JSON.stringify(lastEvaluatedKey)}`);
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'postsByPublishDate-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status', },
        ExpressionAttributeValues: { ':status': 'published', },
        ScanIndexForward: false,
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
      };
      this.logger.debug(`[queryPaginatedPostsFromDb] Parâmetros para consulta paginada no DynamoDB: ${JSON.stringify(params)}`);
      const result = await this.dynamoDbService.query(params);
      this.logger.debug(`[queryPaginatedPostsFromDb] Resultado da consulta paginada no DynamoDB: ${JSON.stringify(result)}`);
      const items = result.Items || [];
      const data = items.map(item => this.mapToSummaryDto(item));
      this.logger.verbose(`[queryPaginatedPostsFromDb] Consulta paginada concluída. Itens na página: ${data.length}`);
      return { data, total: -1, hasMore: !!result.LastEvaluatedKey, lastEvaluatedKey: result.LastEvaluatedKey };
    } catch (error) {
      this.logger.error(`[queryPaginatedPostsFromDb] Erro na consulta paginada: ${error?.message}`, error?.stack);
      throw error; // Re-lançar o erro para ser capturado no método pai
    } finally {
      this.logger.debug('[queryPaginatedPostsFromDb] Finalizando consulta paginada do banco.');
    }
  }

  /**
   * Mapeia um item do DynamoDB para o DTO de detalhe do post.
   *
   * @param item - Item retornado do banco.
   * @returns Objeto com os detalhes do post.
   */
  private mapToDetailDto(item: any): any {
    this.logger.debug(`[mapToDetailDto] Mapeando item para Detail DTO: ${JSON.stringify(item)}`);
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
      'categoryId#subcategoryId': item['categoryId#subcategoryId'], // Adicione esta linha
    };
  }

  /**
   * Mapeia um item do DynamoDB para o DTO de conteúdo do post.
   *
   * @param item - Item retornado do banco.
   * @returns Objeto do tipo PostContentDto.
   */
  private mapToContentDto(item: any): PostContentDto {
    this.logger.debug(`[mapToContentDto] Mapeando item para Content DTO: ${JSON.stringify(item)}`);
    return {
      categoryIdSubcategoryId: item['categoryId#subcategoryId']?.['S'],
      postId: item.postId?.['S'],
      authorId: item.authorId?.['S'],
      canonical: item.canonical?.['S'],
      categoryId: item.categoryId?.['S'],
      contentHTML: item.contentHTML?.['S'],
      createdAt: item.createdAt?.['S'],
      description: item.description?.['S'],
      featuredImageURL: item.featuredImageURL?.['S'],
      keywords: item.keywords?.['L']?.map((keywordObj: any) => keywordObj['S']),
      modifiedDate: item.modifiedDate?.['S'],
      publishDate: item.publishDate?.['S'],
      readingTime: Number(item.readingTime?.['N']),
      slug: item.slug?.['S'],
      status: item.status?.['S'],
      subcategoryId: item.subcategoryId?.['S'],
      tags: item.tags?.['L']?.map((tagObj: any) => tagObj['S']),
      title: item.title?.['S'],
      views: Number(item.views?.['N']),
    } as PostContentDto;
  }

  /**
   * Mapeia um item do DynamoDB para o DTO de resumo do post.
   *
   * @param item - Item retornado do banco.
   * @returns Objeto do tipo PostSummaryDto.
   */
  private mapToSummaryDto(item: any): PostSummaryDto {
    this.logger.debug(`[mapToSummaryDto] Mapeando item para Summary DTO: ${JSON.stringify(item)}`);
    return {
      postId: item.postId,
      title: item.title,
      featuredImageURL: item.featuredImageURL,
      description: item.description,
      publishDate: item.publishDate,
      readingTime: item.readingTime,
    };
  }

  /**
   * Converte um item do DynamoDB (AttributeValue) em um objeto do tipo PostContentDto.
   *
   * @param item - Objeto do DynamoDB no formato Record<string, AttributeValue>.
   * @returns Objeto do tipo PostContentDto contendo os dados extraídos do DynamoDB.
   */
  private mapDynamoDBItemToPostContentDto(item: Record<string, AttributeValue>): PostContentDto {
    this.logger.debug(`[mapDynamoDBItemToPostContentDto] Mapeando item do DynamoDB para Content DTO: ${JSON.stringify(item)}`);
    return {
      title: item.title?.S || (item.title as string) || '',
      slug: item.slug?.S || (item.slug as string) || '',
      contentHTML: item.contentHTML?.S || (item.contentHTML as string) || '',
      featuredImageURL: item.featuredImageURL?.S || (item.featuredImageURL as string) || '',
      keywords: item.keywords instanceof Set ? Array.from(item.keywords).map((k) => String(k)) : item.keywords?.SS || (Array.isArray(item.keywords) ? item.keywords.map((k) => String(k)) : []),
      publishDate: item.publishDate?.S || (item.publishDate as string) || '',
      modifiedDate: item.modifiedDate?.S || (item.modifiedDate as string) || '',
      readingTime: Number(item.readingTime?.N) || 0,
      tags: item.tags instanceof Set ? Array.from(item.tags).map((t) => String(t)) : item.tags?.SS || (Array.isArray(item.tags) ? item.tags.map((t) => String(t)) : []),
      views: Number(item.views?.N) || 0,
    };
  }

  /**
   * Constrói a expressão de atualização para o comando de update no DynamoDB.
   *
   * @param updateData - Dados para atualização do post.
   * @returns A string com a expressão de atualização.
   */
  private buildUpdateExpression(updateData: PostUpdateDto): string {
    this.logger.debug(`[buildUpdateExpression] Construindo expressão de atualização para: ${JSON.stringify(updateData)}`);
    const updateFields = Object.keys(updateData).filter(
      key => key !== 'postId' && key !== 'modifiedDate',
    );
    if (updateFields.length > 0) {
      const expression = `SET ${updateFields.map(field => `#${field} = :${field}`).join(', ')}, #modifiedDate = :modifiedDate`;
      this.logger.debug(`[buildUpdateExpression] Expressão de atualização gerada: ${expression}`);
      return expression;
    }
    this.logger.debug('[buildUpdateExpression] Nenhuma atualização de campo além de modifiedDate.');
    return 'SET #modifiedDate = :modifiedDate';
  }

  /**
   * Gera os ExpressionAttributeNames para a update expression, evitando conflitos com palavras reservadas.
   *
   * @param updateData - Dados para atualização do post.
   * @returns Objeto com os nomes dos atributos.
   */
  private getUpdateExpressionAttributeNames(updateData: PostUpdateDto): any {
    this.logger.debug(`[getUpdateExpressionAttributeNames] Gerando ExpressionAttributeNames para: ${JSON.stringify(updateData)}`);
    const attributeNames: any = { '#modifiedDate': 'modifiedDate' };
    Object.keys(updateData)
      .filter(key => key !== 'postId' && key !== 'modifiedDate')
      .forEach(field => {
        attributeNames[`#${field}`] = field;
      });
    this.logger.debug(`[getUpdateExpressionAttributeNames] ExpressionAttributeNames gerados: ${JSON.stringify(attributeNames)}`);
    return attributeNames;
  }

  /**
   * Gera os ExpressionAttributeValues para a update expression.
   *
   * @param updateData - Dados para atualização do post.
   * @returns Objeto com os valores dos atributos.
   */
  private getUpdateExpressionAttributeValues(updateData: PostUpdateDto): any {
    this.logger.debug(`[getUpdateExpressionAttributeValues] Gerando ExpressionAttributeValues para: ${JSON.stringify(updateData)}`);
    const attributeValues: any = { ':modifiedDate': new Date().toISOString() };
    Object.keys(updateData)
      .filter(key => key !== 'postId' && key !== 'modifiedDate')
      .forEach(field => {
        attributeValues[`:${field}`] = updateData[field];
      });
    this.logger.debug(`[getUpdateExpressionAttributeValues] ExpressionAttributeValues gerados: ${JSON.stringify(attributeValues)}`);
    return attributeValues;
  }

  /**
   * Sanitiza os dados do post, removendo campos que não devem ser enviados ao banco.
   *
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
   *
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
      this.logger.error(`[getCachedOrQuery] Erro ao executar a consulta para a chave: ${cacheKey}: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Atualiza os caches relacionados a um post, removendo chaves antigas.
   *
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
        for (let limit of [5, 10, 20]) { // Limites comuns
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
   * Mapeia um item do DynamoDB para o DTO de conteúdo do post.
   *
   * @param item - Item retornado do banco.
   * @returns Objeto do tipo PostContentDto.
   */
  private mapToContentDto(item: any): PostContentDto {
    this.logger.debug(`[mapToContentDto] Mapeando item para Content DTO: ${JSON.stringify(item)}`);
    return {
      categoryIdSubcategoryId: item['categoryId#subcategoryId']?.['S'],
      postId: item.postId?.['S'],
      authorId: item.authorId?.['S'],
      canonical: item.canonical?.['S'],
      categoryId: item.categoryId?.['S'],
      contentHTML: item.contentHTML?.['S'],
      createdAt: item.createdAt?.['S'],
      description: item.description?.['S'],
      featuredImageURL: item.featuredImageURL?.['S'],
      keywords: item.keywords?.['L']?.map((keywordObj: any) => keywordObj['S']),
      modifiedDate: item.modifiedDate?.['S'],
      publishDate: item.publishDate?.['S'],
      readingTime: Number(item.readingTime?.['N']),
      slug: item.slug?.['S'],
      status: item.status?.['S'],
      subcategoryId: item.subcategoryId?.['S'],
      tags: item.tags?.['L']?.map((tagObj: any) => tagObj['S']),
      title: item.title?.['S'],
      views: Number(item.views?.['N']),
    } as PostContentDto;
  }
}
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
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { v4 as uuidv4 } from 'uuid';
import {
  GetCommandInput,
  PutCommandInput,
  QueryCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  ScanCommandInput,
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
   * Cria um novo post no DynamoDB e atualiza os caches relacionados.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado como PostContentDto.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  async createPost(createPostDto: PostCreateDto): Promise<PostContentDto> {
    this.logger.debug(`Iniciando criação do post com dados: ${JSON.stringify(createPostDto)}`);
    try {
      const compositeKey = `${createPostDto.categoryId}#${createPostDto.subcategoryId}`;
      const postId = uuidv4();
      const publishDate = new Date().toISOString();

      const postItem = {
        'categoryId#subcategoryId': compositeKey,
        postId,
        createdAt: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        publishDate: publishDate,
        views: 0,
        status: 'draft',
        ...this.sanitizePostData(createPostDto),
      };

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: postItem,
      };

      this.logger.debug(`Parâmetros para inserção no DynamoDB: ${JSON.stringify(params)}`);
      await this.dynamoDbService.putItem(params);
      await this.refreshRelatedCaches(compositeKey, postId);
      this.logger.verbose(`Post criado com sucesso, ID: ${postId}`);
      return this.mapToContentDto(postItem);
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error?.message}`, error?.stack);
      throw new BadRequestException({
        message: 'Falha ao criar post',
        originalError: error?.message,
      });
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
    this.logger.debug(`Buscando posts paginados. Página: ${page}, Limite: ${limit}`);
    return this.getCachedOrQuery(
      cacheKey,
      () => this.queryPaginatedPostsFromDb(page, limit),
      300, // Cache por 5 minutos
    );
  }

  /**
   * Retorna um post completo com base no slug.
   * @param slug - Slug do post.
   * @returns O post completo como PostContentDto.
   */
  async getPostBySlug(slug: string): Promise<PostContentDto> {
    this.logger.debug(`Buscando post pelo slug: ${slug}`);
    // Implementação provisória – substituir por consulta real
    const dummyPost: PostContentDto = {
      title: 'Título do Post Exemplo',
      slug: slug,
      contentHTML: '<p>Este é um conteúdo de post de exemplo.</p>',
      featuredImageURL: 'https://example.com/exemplo-imagem.jpg',
      keywords: ['exemplo', 'post'],
      publishDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      readingTime: 3,
      tags: ['exemplo-tag'],
      views: 50,
    };
    return dummyPost;
  }

  /**
   * Busca um post pelo seu ID no DynamoDB.
   * @param postId - Identificador do post.
   * @returns O post encontrado como objeto de detalhe.
   * @throws NotFoundException se o post não for encontrado.
   */
  async getPostById(postId: string): Promise<any> {
    this.logger.debug(`Buscando post pelo ID: ${postId}`);
    try {
      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: { postId },
      };

      const result = await this.dynamoDbService.getItem(params);
      if (!result.Item) {
        this.logger.warn(`Post não encontrado para ID: ${postId}`);
        throw new NotFoundException('Post não encontrado');
      }
      return this.mapToDetailDto(result.Item);
    } catch (error) {
      this.logger.error(`Erro ao buscar post por ID: ${error?.message}`, error?.stack);
      throw new NotFoundException({
        message: 'Post não encontrado',
        originalError: error?.message,
      });
    }
  }

  /**
   * Atualiza um post existente no DynamoDB.
   * @param postId - Identificador do post.
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado como PostContentDto.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  async updatePost(postId: string, updatePostDto: PostUpdateDto): Promise<PostContentDto> {
    this.logger.debug(`Iniciando atualização do post ID: ${postId} com dados: ${JSON.stringify(updatePostDto)}`);
    try {
      const existingPost = await this.getPostById(postId);
      const compositeKey = existingPost['categoryId#subcategoryId'];

      const updateParams: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': compositeKey,
          postId: postId,
        },
        UpdateExpression: this.buildUpdateExpression(updatePostDto),
        ExpressionAttributeNames: this.getUpdateExpressionAttributeNames(updatePostDto),
        ExpressionAttributeValues: this.getUpdateExpressionAttributeValues(updatePostDto),
        ReturnValues: 'ALL_NEW',
      };

      this.logger.debug(`Parâmetros para atualização no DynamoDB: ${JSON.stringify(updateParams)}`);
      const result = await this.dynamoDbService.updateItem(updateParams);
      await this.refreshRelatedCaches(compositeKey, postId);
      this.logger.verbose(`Post atualizado com sucesso, ID: ${postId}`);
      return this.mapToContentDto(result.Attributes);
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${error?.message}`, error?.stack);
      throw new BadRequestException({
        message: 'Falha ao atualizar post',
        originalError: error?.message,
      });
    }
  }

  /**
   * Deleta um post do DynamoDB.
   * @param postId - Identificador do post.
   */
  @CacheClear(['posts:*', 'post-details:*', 'latest_posts', 'paginated_posts:*'])
  async deletePost(postId: string): Promise<void> {
    this.logger.debug(`Iniciando deleção do post ID: ${postId}`);
    try {
      const post = await this.getPostById(postId);
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': post['categoryId#subcategoryId'],
          postId: postId,
        },
      };

      this.logger.debug(`Parâmetros para deleção no DynamoDB: ${JSON.stringify(params)}`);
      await this.dynamoDbService.deleteItem(params);
      await this.refreshRelatedCaches(post['categoryId#subcategoryId'], postId);
      this.logger.verbose(`Post deletado com sucesso, ID: ${postId}`);
    } catch (error) {
      this.logger.error(`Erro ao deletar post: ${error?.message}`, error?.stack);
      throw new BadRequestException({
        message: 'Falha ao deletar post',
        originalError: error?.message,
      });
    }
  }

  // ────────────────────────── Métodos Auxiliares ──────────────────────────

  /**
   * Executa uma consulta de paginação de posts no DynamoDB.
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @returns Objeto contendo os dados paginados e o total de posts.
   */
  private async queryPaginatedPostsFromDb(page: number, limit: number): Promise<{ data: PostSummaryDto[]; total: number }> {
    this.logger.debug(`Executando query para paginação. Página: ${page}, Limite: ${limit}`);
    const startIndex = (page - 1) * limit;
    const scanParams: ScanCommandInput = {
      TableName: this.tableName,
      Limit: limit,
    };

    try {
      const result = await this.dynamoDbService.scan(scanParams);
      const items = result.Items || [];
      const total = items.length;
      const paginatedItems = items.slice(0, limit);
      const data = paginatedItems.map(item => this.mapToSummaryDto(item));

      this.logger.verbose(`Query paginada concluída. Total de itens: ${total}`);
      return { data, total };
    } catch (error) {
      this.logger.error(`Erro ao executar Scan paginado: ${error?.message}`, error?.stack);
      return { data: [], total: 0 };
    }
  }

  /**
   * Mapeia um item do DynamoDB para o DTO de detalhe do post.
   * @param item - Item retornado do banco.
   * @returns Objeto com os detalhes do post.
   */
  private mapToDetailDto(item: any): any {
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
   * Mapeia um item do DynamoDB para o DTO de conteúdo do post.
   * @param item - Item retornado do banco.
   * @returns Objeto do tipo PostContentDto.
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
    };
  }

  /**
   * Mapeia um item do DynamoDB para o DTO de resumo do post.
   * @param item - Item retornado do banco.
   * @returns Objeto do tipo PostSummaryDto.
   */
  private mapToSummaryDto(item: any): PostSummaryDto {
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
   * Constrói a expressão de atualização para o comando de update no DynamoDB.
   * @param updateData - Dados para atualização do post.
   * @returns A string com a expressão de atualização.
   */
  private buildUpdateExpression(updateData: PostUpdateDto): string {
    const updateFields = Object.keys(updateData).filter(key => key !== 'postId');
    return `SET ${updateFields.map(field => `#${field} = :${field}`).join(', ')}`;
  }

  /**
   * Gera os ExpressionAttributeNames para a update expression, evitando conflitos com palavras reservadas.
   * @param updateData - Dados para atualização do post.
   * @returns Objeto com os nomes dos atributos.
   */
  private getUpdateExpressionAttributeNames(updateData: PostUpdateDto): any {
    const attributeNames: any = {};
    Object.keys(updateData).filter(key => key !== 'postId').forEach(field => {
      attributeNames[`#${field}`] = field;
    });
    return attributeNames;
  }

  /**
   * Gera os ExpressionAttributeValues para a update expression.
   * @param updateData - Dados para atualização do post.
   * @returns Objeto com os valores dos atributos.
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
   * @returns Objeto com os dados sanitizados.
   */
  private sanitizePostData(postData: PostCreateDto | PostUpdateDto): any {
    const sanitizedData = { ...postData };
    delete sanitizedData.postId;
    delete sanitizedData.categoryIdSubcategoryId;
    return sanitizedData;
  }

  /**
   * Recupera dados do cache ou executa a consulta e armazena o resultado.
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
    this.logger.debug(`Verificando cache para chave: ${cacheKey}`);
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit para a chave: ${cacheKey}`);
      return cached;
    }
    this.logger.debug(`Cache miss para a chave: ${cacheKey}. Executando query.`);
    const result = await queryFn();
    await this.cacheManager.set(cacheKey, result, ttl);
    return result;
  }

  /**
   * Atualiza os caches relacionados a um post, removendo chaves antigas.
   * @param compositeKey - Chave composta no formato "categoria#subcategoria".
   * @param postId - Identificador do post.
   */
  private async refreshRelatedCaches(compositeKey: string, postId: string): Promise<void> {
    this.logger.debug(`Atualizando caches relacionados ao post ID: ${postId}`);
    await this.cacheManager.del(`post_${postId}`);
    await this.cacheManager.del(`category_${compositeKey}`);
    await this.cacheManager.del(this.latestPostsCacheKey);
    await this.cacheManager.del(this.paginatedPostsCacheKeyPrefix);
  }
}

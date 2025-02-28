import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CreatePostDto,
  UpdatePostDto,
  PostDetailDto,
  PostSummaryDto,
} from '@src/modules/blog/posts/dto';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import {
  GetCommandInput,
  QueryCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthorDto } from '@src/modules/blog/authors/dto/Author-detail.dto';

const DEFAULT_CACHE_TTL = 300; // 5 minutos

@Injectable()
export class PostsService {
  private tableName = 'Posts';
  private readonly logger = new Logger(PostsService.name);
  private readonly cacheTTL: number;

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private readonly authorsService: AuthorsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    // Define o TTL do cache com base na variável de ambiente ou utiliza o valor padrão
    this.cacheTTL = parseInt(process.env.CACHE_TTL) || DEFAULT_CACHE_TTL;
  }

  /**
   * Cria um novo post.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado como PostDetailDto.
   */
  async createPost(
    categoryIdSubcategoryId: string,
    createPostDto: CreatePostDto
  ): Promise<PostDetailDto> {
    this.logger.debug('Iniciando criação do post');
    try {
      const postId = uuidv4(); // Gera um ID único para o post

      // Recupera informações do autor utilizando cache para otimização
      // Caso o autor não seja encontrado, o método já lança NotFoundException
      const author = await this.getAuthorWithCache(createPostDto.authorId);

      // Constrói o item a ser armazenado no DynamoDB, incluindo os dados do autor
      const item = {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId,
        collection: 'posts', // Campo usado para índices
        createdAt: new Date().toISOString(), // Data/hora atual
        ...createPostDto,
        // Garante que os campos numéricos sejam convertidos corretamente
        readingTime: Number(createPostDto.readingTime) || 0,
        views: Number(createPostDto.views) || 0,
        // Você pode optar por armazenar apenas o authorId ou o objeto completo,
        // conforme a necessidade do seu domínio. Exemplo armazenando o objeto completo:
        author,
      };

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: item,
      };

      await this.dynamoDbService.putItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug('Post criado com sucesso');

      // Aqui, o mapeamento pode incluir os dados do post que deseja retornar,
      // inclusive o author, se necessário.
      return this.mapDynamoItemToPostDto(item);
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error.message}`, error.stack);
      throw new BadRequestException('Falha ao criar post');
    }
  }



  /**
   * Busca os 20 posts mais recentes (publicados).
   *
   * @returns Uma lista de posts como PostSummaryDto.
   */
  async getLatestPosts(): Promise<PostSummaryDto[]> {
    this.logger.debug('Buscando os 20 posts mais recentes');
    const cacheKey = 'latest_posts';
    const cachedPosts = await this.cacheManager.get<PostDetailDto[]>(cacheKey);
    if (cachedPosts) {
      this.logger.debug('Retornando posts do cache');
      return cachedPosts;
    }

    // Obtém a data/hora atual no formato ISO 8601 para comparação
    const now = new Date().toISOString();

    const queryParams: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: 'postsByPublishDate-index',
      KeyConditionExpression: '#st = :status AND #pd < :now',
      ExpressionAttributeNames: {
        '#st': 'status',
        '#pd': 'publishDate',
      },
      ExpressionAttributeValues: {
        ':status': 'published',
        ':now': now,
      },
      ScanIndexForward: false,
      Limit: 20,
    };

    try {
      const result = await this.dynamoDbService.query(queryParams);
      const posts = result.Items
        ? result.Items.map(this.mapDynamoItemToPostDto)
        : [];
      await this.cacheManager.set(cacheKey, posts, { ttl: this.cacheTTL });
      this.logger.debug(`Foram encontrados ${posts.length} posts`);
      return posts;
    } catch (error) {
      this.logger.error('Erro ao buscar posts mais recentes', error);
      throw new Error('Erro ao buscar posts mais recentes');
    }
  }

  /**
   * Busca um post pelo seu ID.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @returns O post encontrado como PostDetailDto.
   */
  async getPostById(
    categoryIdSubcategoryId: string,
    postId: string
  ): Promise<PostDetailDto> {
    this.logger.debug(`Iniciando busca do post ${postId}`);
    try {
      const cacheKey = `post_${categoryIdSubcategoryId}_${postId}`;
      const cached = await this.cacheManager.get<PostDetailDto>(cacheKey);
      if (cached) return cached;

      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
      };

      const result = await this.dynamoDbService.getItem(params);
      if (!result.Item)
        throw new NotFoundException('Post não encontrado');

      // Aguarda a obtenção do post completo
      const post = await this.getFullPostById(categoryIdSubcategoryId, postId);
      await this.cacheManager.set(cacheKey, post, this.cacheTTL);
      this.logger.debug(`Post ${postId} encontrado com sucesso`);
      return post;
    } catch (error) {
      this.logger.error(`Erro ao buscar post: ${error.message}`);
      throw new NotFoundException('Post não encontrado');
    }
  }

  /**
   * Atualiza um post existente.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado como PostDetailDto.
   */
  async updatePost(
    categoryIdSubcategoryId: string,
    postId: string,
    updatePostDto: UpdatePostDto
  ): Promise<PostDetailDto> {
    this.logger.debug(`Iniciando atualização do post ${postId}`);
    try {
      const updateExpression = this.dynamoDbService.buildUpdateExpression(
        updatePostDto
      );
      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
        ...updateExpression,
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamoDbService.updateItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug(`Post ${postId} atualizado com sucesso`);
      return this.mapDynamoItemToPostDto(result.Attributes);
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar post');
    }
  }

  /**
   * Deleta um post.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   */
  async deletePost(
    categoryIdSubcategoryId: string,
    postId: string
  ): Promise<void> {
    this.logger.debug(`Iniciando deleção do post ${postId}`);
    try {
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
      };

      await this.dynamoDbService.deleteItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug(`Post ${postId} deletado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao deletar post: ${error.message}`);
      throw new BadRequestException('Falha ao deletar post');
    }
  }

  /**
   * Busca um autor utilizando cache.
   *
   * @param authorId - Identificador do autor.
   * @returns O autor encontrado como AuthorDto.
   */
  private async getAuthorWithCache(authorId: string): Promise<AuthorDetailDto> {
    const cacheKey = `author_${authorId}`;
    const cached = await this.cacheManager.get<AuthorDetailDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Consulta o serviço de authors (pode ser uma chamada ao DynamoDB ou repositório)
    const author = await this.authorsService.getAuthorById(authorId);
    if (!author) {
      this.logger.error(`Autor não encontrado: ${authorId}`);
      throw new NotFoundException('Autor não encontrado');
    }

    await this.cacheManager.set(cacheKey, author, this.cacheTTL);
    return author;
  }

  /**
   * Invalida o cache para um post específico.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   */
  private async invalidateCache(
    categoryIdSubcategoryId: string,
    postId: string
  ) {
    try {
      const keys = [
        `post_${categoryIdSubcategoryId}_${postId}`,
        `posts_${categoryIdSubcategoryId}`,
        'posts_all',
      ];
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    } catch (error) {
      this.logger.error(`Erro ao invalidar cache: ${error.message}`);
    }
  }

  /**
   * Mapeia um item do DynamoDB para um DTO de post (detalhado ou resumo).
   *
   * @param item - Item retornado do DynamoDB.
   * @returns O DTO de post (PostDetailDto).
   */
  private mapDynamoItemToPostDto(item: any): PostDetailDto {
    return {
      title: item.title,
      featuredImageURL: item.featuredImageURL,
      description: item.description,
    };
  }

  /**
   * Mapeia um item do DynamoDB para um DTO de post detalhado.
   *
   * @param item - Item retornado do DynamoDB.
   * @returns O DTO de post detalhado (PostDetailDto).
   */
  private mapDynamoItemToPostDetailDto(item: any): PostDetailDto {
    // Aqui você pode mapear todos os campos relevantes do item para o DTO
    return {
      title: item.title,
      featuredImageURL: item.featuredImageURL,
      description: item.description,
    };
  }

  /**
   * Busca um post completo pelo seu ID.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @returns O post completo encontrado (PostDetailDto) com todos os campos mapeados.
   */
  async getFullPostById(
    categoryIdSubcategoryId: string,
    postId: string
  ): Promise<PostDetailDto> {
    this.logger.debug(`Iniciando busca completa do post ${postId}`);
    try {
      const cacheKey = `post_detail_${categoryIdSubcategoryId}_${postId}`;
      const cached = await this.cacheManager.get<PostDetailDto>(cacheKey);
      if (cached) return cached;

      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
      };

      const result = await this.dynamoDbService.getItem(params);
      if (!result.Item) {
        throw new NotFoundException('Post não encontrado');
      }

      // Mapeia o item retornado para o DTO PostDetailDto com todos os campos definidos
      const postDetailDto: PostDetailDto = {
        // Campos herdados de PostSummaryDto (ex.: title, featuredImageURL, description)
        title: result.Item.title,
        featuredImageURL: result.Item.featuredImageURL,
        description: result.Item.description,
        // Campos exclusivos de PostDetailDto
        contentHTML: result.Item.contentHTML,
        authorId: result.Item.authorId,
        canonical: result.Item.canonical,
        keywords: result.Item.keywords,
        readingTime: result.Item.readingTime ? Number(result.Item.readingTime) : 0,
        views: result.Item.views ? Number(result.Item.views) : 0,
        slug: result.Item.slug,
        status: result.Item.status,
        modifiedDate: result.Item.modifiedDate,
        excerpt: result.Item.excerpt,
      };

      await this.cacheManager.set(cacheKey, postDetailDto, { ttl: this.cacheTTL });
      this.logger.debug(`Post completo ${postId} encontrado com sucesso`);
      return postDetailDto;
    } catch (error) {
      this.logger.error(`Erro ao buscar post completo: ${error.message}`);
      throw new NotFoundException('Post não encontrado');
    }
  }





}

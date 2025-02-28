import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  BadRequestException
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreatePostDto, UpdatePostDto, PostDto, FullPostDto } from '@src/modules/blog/posts/dto';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import {
  GetCommandInput,
  QueryCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput
} from '@aws-sdk/lib-dynamodb';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthorDto } from '../authors/dto';

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
    this.cacheTTL = parseInt(process.env.CACHE_TTL) || DEFAULT_CACHE_TTL;
  }

  /**
   * Cria um novo post.
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado.
   */
  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    this.logger.debug('Iniciando criação do post');
    try {
      const postId = uuidv4();
      const author = await this.getAuthorWithCache(createPostDto.authorId);

      // Constrói o item usando os campos do DTO já no nível raiz
      const item = {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId,
        collection: 'posts', // Usado para o índice
        createdAt: new Date().toISOString(),
        ...createPostDto,
        // Garantindo tipos corretos
        readingTime: Number(createPostDto.readingTime) || 0,
        views: Number(createPostDto.views) || 0
      };

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: item
      };

      await this.dynamoDbService.putItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug('Post criado com sucesso');
      return this.mapDynamoItemToPostDto(item);
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error.message}`, error.stack);
      throw new BadRequestException('Falha ao criar post');
    }
  }

  /**
   * Busca os 20 posts mais recentes.
   * @returns Uma lista dos posts mais recentes.
   */
  async getLatestPosts(): Promise<PostDto[]> {
    this.logger.debug('Buscando os 20 posts mais recentes');
    const cacheKey = 'latest_posts';
    const cachedPosts = await this.cacheManager.get<PostDto[]>(cacheKey);
    if (cachedPosts) {
      this.logger.debug('Retornando posts do cache');
      return cachedPosts;
    }

    const queryParams: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: 'postsByPublishDate-index',
      KeyConditionExpression: 'collection = :col',
      ExpressionAttributeValues: {
        ':col': 'posts'
      },
      ScanIndexForward: false,
      Limit: 20
    };

    try {
      const result = await this.dynamoDbService.query(queryParams);
      const posts = result.Items ? result.Items.map(this.mapDynamoItemToPostDto) : [];
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
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @returns O post encontrado.
   */
  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    this.logger.debug(`Iniciando busca do post ${postId}`);
    try {
      const cacheKey = `post_${categoryIdSubcategoryId}_${postId}`;
      const cached = await this.cacheManager.get<PostDto>(cacheKey);
      if (cached) return cached;

      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId
        }
      };

      const result = await this.dynamoDbService.getItem(params);
      if (!result.Item) throw new NotFoundException('Post não encontrado');

      const post = this.mapDynamoItemToPostDto(result.Item);
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
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado.
   */
  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    this.logger.debug(`Iniciando atualização do post ${postId}`);
    try {
      const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto);
      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId
        },
        ...updateExpression,
        ReturnValues: 'ALL_NEW'
      };

      const result = await this.dynamoDbService.updateItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug(`Post ${postId atualizado com sucesso`);
      return this.mapDynamoItemToPostDto(result.Attributes);
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar post');
    }
  }

  /**
   * Deleta um post.
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   */
  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    this.logger.debug(`Iniciando deleção do post ${postId}`);
    try {
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId
        }
      };

      await this.dynamoDbService.deleteItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug(`Post ${postId deletado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao deletar post: ${error.message}`);
      throw new BadRequestException('Falha ao deletar post');
    }
  }

  /**
   * Busca um autor com cache.
   * @param authorId - Identificador do autor.
   * @returns O autor encontrado.
   */
  private async getAuthorWithCache(authorId: string): Promise<AuthorDto> {
    try {
      const cacheKey = `author_${authorId}`;
      const cached = await this.cacheManager.get<AuthorDto>(cacheKey);
      if (cached) return cached;

      const author = await this.authorsService.getAuthorById(authorId);
      await this.cacheManager.set(cacheKey, author, this.cacheTTL);
      return author;
    } catch (error) {
      this.logger.error(`Autor não encontrado: ${authorId}`);
      throw new NotFoundException('Autor não encontrado');
    }
  }

  /**
   * Invalida o cache para um post específico.
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   */
  private async invalidateCache(categoryIdSubcategoryId: string, postId: string) {
    try {
      const keys = [
        `post_${categoryIdSubcategoryId}_${postId}`,
        `posts_${categoryIdSubcategoryId}`,
        'posts_all'
      ];
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
    } catch (error) {
      this.logger.error(`Erro ao invalidar cache: ${error.message}`);
    }
  }

  /**
   * Mapeia um item do DynamoDB para um DTO de post.
   * @param item - Item do DynamoDB.
   * @returns O DTO de post.
   */
  private mapDynamoItemToPostDto(item: any): PostDto {
    return {
      'categoryId#subcategoryId': item['categoryId#subcategoryId'],
      postId: item.postId,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      contentHTML: item.contentHTML,
      authorId: item.authorId,
      excerpt: item.excerpt,
      featuredImageURL: item.featuredImageURL,
      modifiedDate: item.modifiedDate,
      publishDate: item.publishDate,
      readingTime: Number(item.readingTime) || 0,
      slug: item.slug,
      status: item.status,
      title: item.title,
      views: Number(item.views) || 0,
      canonical: item.canonical,
      description: item.description,
      keywords: item.keywords,
      collection: item.collection,
      createdAt: item.createdAt
    };
  }

  /**
   * Busca um post completo pelo seu ID.
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @returns O post completo encontrado.
   */
  async getFullPostById(categoryIdSubcategoryId: string, postId: string): Promise<FullPostDto> {
    this.logger.debug(`Iniciando busca completa do post ${postId}`);
    const post = await this.getPostById(categoryIdSubcategoryId, postId);
    this.logger.debug(`Post completo ${postId encontrado com sucesso`);
    return {
      ...post,
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'cache/database'
      }
    };
  }
}

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
   * @param categoryIdSubcategoryId - ID da categoria e subcategoria.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado.
   */
  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    this.logger.debug('Iniciando criação do post');
    try {
      const postId = uuidv4();
      const author = await this.getAuthorWithCache(createPostDto.postInfo.authorId);

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
          entityType: 'POST',
          createdAt: new Date().toISOString(),
          ...createPostDto,
          postInfo: {
            ...createPostDto.postInfo,
            authorName: author.name,
            readingTime: Number(createPostDto.postInfo.readingTime) || 0,
            views: Number(createPostDto.postInfo.views) || 0
          }
        }
      };

      await this.dynamoDbService.putItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug('Post criado com sucesso');
      return this.mapDynamoItemToPostDto(params.Item);
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error.message}`, error.stack);
      throw new BadRequestException('Falha ao criar post');
    }
  }

  /**
   * Busca todos os posts com paginação.
   * @param lastKey - Chave para paginação.
   * @returns Lista de posts e a última chave.
   */
  async getAllPosts(lastKey?: any): Promise<{ posts: PostDto[], lastKey: any | null }> {
    this.logger.debug('Iniciando busca de todos os posts');
    try {
      const cacheKey = `posts_page_${lastKey ? JSON.stringify(lastKey) : 'first'}`;

      const cached = await this.cacheManager.get<{ posts: PostDto[], lastKey: any | null }>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit para ${cacheKey}`);
        return cached;
      }

      const now = new Date().toISOString();

      const queryParams: any = {
        TableName: "Posts",
        IndexName: "PostsByStatusIndex",
        KeyConditionExpression: "#status = :published AND #publishDate <= :now",
        ExpressionAttributeNames: {
          "#status": "postInfo.status",
          "#publishDate": "postInfo.publishDate"
        },
        ExpressionAttributeValues: {
          ":published": "published",
          ":now": now
        },
        ScanIndexForward: false,
        Limit: 20
      };

      if (lastKey) {
        queryParams.ExclusiveStartKey = lastKey;
      }

      const result = await this.dynamoDbService.query(queryParams);
      const newLastKey = result.LastEvaluatedKey || null;

      const posts: PostDto[] = result.Items.map(item => this.mapToPostDto(item));

      await this.cacheManager.set(cacheKey, { posts, lastKey: newLastKey }, { ttl: 60 * 5 });

      this.logger.debug('Posts obtidos com sucesso');
      return { posts, lastKey: newLastKey };

    } catch (error) {
      this.logger.error('Erro ao obter as postagens', error);
      throw new Error('Erro ao obter as postagens');
    }
  }

  /**
   * Busca um post pelo ID.
   * @param categoryIdSubcategoryId - ID da categoria e subcategoria.
   * @param postId - ID do post.
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
   * Atualiza um post.
   * @param categoryIdSubcategoryId - ID da categoria e subcategoria.
   * @param postId - ID do post.
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
      this.logger.debug(`Post ${postId} atualizado com sucesso`);
      return this.mapDynamoItemToPostDto(result.Attributes);
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar post');
    }
  }

  /**
   * Deleta um post.
   * @param categoryIdSubcategoryId - ID da categoria e subcategoria.
   * @param postId - ID do post.
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
      this.logger.debug(`Post ${postId} deletado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao deletar post: ${error.message}`);
      throw new BadRequestException('Falha ao deletar post');
    }
  }

  private async getAuthorWithCache(authorId: string) {
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

  private mapDynamoItemToPostDto(item: any): PostDto {
    return {
      'categoryId#subcategoryId': item['categoryId#subcategoryId'],
      postId: item.postId,
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId,
      contentHTML: item.contentHTML,
      postInfo: item.postInfo && {
        ...item.postInfo,
        readingTime: Number(item.postInfo?.readingTime) || 0,
        views: Number(item.postInfo?.views) || 0
      },
      seo: item.seo
    };
  }

  /**
   * Método adicional para obter post completo.
   * @param categoryIdSubcategoryId - ID da categoria e subcategoria.
   * @param postId - ID do post.
   * @returns O post completo.
   */
  async getFullPostById(categoryIdSubcategoryId: string, postId: string): Promise<FullPostDto> {
    this.logger.debug(`Iniciando busca completa do post ${postId}`);
    const post = await this.getPostById(categoryIdSubcategoryId, postId);
    this.logger.debug(`Post completo ${postId} encontrado com sucesso`);
    return {
      ...post,
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'cache/database'
      }
    };
  }
}

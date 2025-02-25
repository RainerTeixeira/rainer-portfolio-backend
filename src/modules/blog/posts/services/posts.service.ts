//src\modules\blog\posts\services\posts.service.ts

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
import { AuthorDto } from '../authors/dto'; // Import AuthorDto - assuming it's needed for caching authors

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

  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
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
            authorName: author.name, // Assuming author.name exists in AuthorDto
            readingTime: Number(createPostDto.postInfo.readingTime) || 0,
            views: Number(createPostDto.postInfo.views) || 0
          }
        }
      };

      await this.dynamoDbService.putItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      return this.mapDynamoItemToPostDto(params.Item);
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error.message}`, error.stack);
      throw new BadRequestException('Falha ao criar post');
    }
  }

  async getAllPosts(lastKey?: any): Promise<{ posts: PostDto[], lastKey: any | null }> {
    try {
      const cacheKey = `posts_page_${lastKey ? JSON.stringify(lastKey) : 'first'}`;
      const cached = await this.cacheManager.get<{ posts: PostDto[], lastKey: any | null }>(cacheKey);

      if (cached) {
        this.logger.debug(`Cache hit para ${cacheKey}`);
        return cached;
      }

      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'PostsByStatusIndex', // Usa o novo GSI
        KeyConditionExpression: '#status = :published AND #publishDate <= :now',
        ExpressionAttributeNames: {
          '#status': 'postInfo.status',
          '#publishDate': 'postInfo.publishDate'
        },
        ExpressionAttributeValues: {
          ':published': { S: 'published' },
          ':now': { S: new Date().toISOString() }
        },
        ScanIndexForward: false, // Ordenação DESC (mais novos primeiro)
        Limit: 20, // Paginação: 20 posts por vez
        ExclusiveStartKey: lastKey || undefined, // Para buscar a próxima página
      };

      this.logger.debug(`Executando query com params: ${JSON.stringify(params)}`);

      const result = await this.dynamoDbService.query(params);
      const posts = (result.Items || []).map(item => this.mapDynamoItemToPostDto(item));

      const response = {
        posts,
        lastKey: result.LastEvaluatedKey || null
      };

      await this.cacheManager.set(cacheKey, response, this.cacheTTL);
      return response;
    } catch (error) {
      this.logger.error(`Erro ao buscar posts: ${error.message}`);
      throw new NotFoundException('Posts não encontrados');
    }
  }

  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
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
      return post;
    } catch (error) {
      this.logger.error(`Erro ao buscar post: ${error.message}`);
      throw new NotFoundException('Post não encontrado');
    }
  }

  async updatePost(
    categoryIdSubcategoryId: string,
    postId: string,
    updatePostDto: UpdatePostDto
  ): Promise<PostDto> {
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
      return this.mapDynamoItemToPostDto(result.Attributes);
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar post');
    }
  }

  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Erro ao deletar post: ${error.message}`);
      throw new BadRequestException('Falha ao deletar post');
    }
  }

  private async getAuthorWithCache(authorId: string) {
    try {
      const cacheKey = `author_${authorId}`;
      const cached = await this.cacheManager.get<AuthorDto>(cacheKey); // Assume AuthorDto is the correct type
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

  async getFullPostById(categoryIdSubcategoryId: string, postId: string): Promise<FullPostDto> {
    const post = await this.getPostById(categoryIdSubcategoryId, postId);
    return {
      ...post,
      metadata: {
        fetchedAt: new Date().toISOString(),
        source: 'cache/database'
      }
    };
  }
}
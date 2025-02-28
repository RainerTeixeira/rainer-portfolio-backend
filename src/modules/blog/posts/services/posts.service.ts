import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  BadRequestException
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreatePostDto, UpdatePostDto, PostDetailDto, PostSummaryDto } from '@src/modules/blog/posts/dto';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { GetCommandInput, QueryCommandInput, PutCommandInput, UpdateCommandInput, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CACHE_TTL = 300;

@Injectable()
export class PostsService {
  private tableName = 'Posts';
  private readonly logger = new Logger(PostsService.name);
  private readonly cacheTTL: number;

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    this.cacheTTL = parseInt(process.env.CACHE_TTL ?? DEFAULT_CACHE_TTL.toString());
  }

  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDetailDto> {
    this.logger.debug('Iniciando criação do post');
    try {
      const postId = uuidv4();

      const item = {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId,
        collection: 'posts',
        createdAt: new Date().toISOString(),
        ...createPostDto,
        readingTime: Number(createPostDto.readingTime) || 0,
        views: Number(createPostDto.views) || 0,
        tags: createPostDto.tags ? createPostDto.tags.join(',') : ''
      };

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: item
      };

      await this.dynamoDbService.putItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug('Post criado com sucesso');
      return this.mapDynamoItemToPostDetailDto(item);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Erro ao criar post: ${error.message}`, error.stack);
      }
      throw new BadRequestException('Falha ao criar post');
    }
  }

  async getLatestPosts(): Promise<PostSummaryDto[]> {
    this.logger.debug('Buscando os 20 posts mais recentes');
    const cacheKey = 'latest_posts';

    const cachedPosts = await this.cacheManager.get<PostSummaryDto[]>(cacheKey);
    if (cachedPosts) {
      this.logger.debug(`Retornando ${cachedPosts.length} posts do cache`);
      return cachedPosts;
    }

    const now = new Date().toISOString();
    this.logger.debug(`Data atual para a consulta: ${now}`);

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
      const posts: PostSummaryDto[] = result.Items
        ? result.Items.map(item => this.mapToPostSummaryDto(item))
        : [];

      this.logger.debug(`Foram encontrados ${posts.length} posts`);

      await this.cacheManager.set(cacheKey, posts, this.cacheTTL);

      return posts;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Erro ao buscar posts mais recentes', error);
      }
      throw new Error('Erro ao buscar posts mais recentes');
    }
  }

  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDetailDto> {
    this.logger.debug(`Iniciando busca do post ${postId}`);
    try {
      const cacheKey = `post_${categoryIdSubcategoryId}_${postId}`;
      const cached = await this.cacheManager.get<PostDetailDto>(cacheKey);
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

      const post = this.mapDynamoItemToPostDetailDto(result.Item);
      await this.cacheManager.set(cacheKey, post, this.cacheTTL);
      this.logger.debug(`Post ${postId} encontrado com sucesso`);
      return post;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Erro ao buscar post: ${error.message}`);
      }
      throw new NotFoundException('Post não encontrado');
    }
  }

  async getFullPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDetailDto> {
    this.logger.debug(`Iniciando busca completa do post ${postId}`);
    return await this.getPostById(categoryIdSubcategoryId, postId);
  }

  async getAllPosts(categoryIdSubcategoryId: string): Promise<PostDetailDto[]> {
    this.logger.debug(`Buscando todos os posts da categoria/subcategoria: ${categoryIdSubcategoryId}`);
    try {
      const queryParams: QueryCommandInput = {
        TableName: this.tableName,
        KeyConditionExpression: '#cs = :cs',
        ExpressionAttributeNames: {
          '#cs': 'categoryId#subcategoryId',
        },
        ExpressionAttributeValues: {
          ':cs': categoryIdSubcategoryId,
        },
      };

      const result = await this.dynamoDbService.query(queryParams);
      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      return result.Items.map(this.mapDynamoItemToPostDetailDto);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Erro ao buscar posts da categoria: ${error.message}`, error.stack);
      }
      throw new Error('Erro ao buscar posts da categoria');
    }
  }

  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDetailDto> {
    this.logger.debug(`Atualizando post ${postId}`);
    try {
      const post = await this.getPostById(categoryIdSubcategoryId, postId);

      const updateParams: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
        UpdateExpression: 'set #title = :title, #contentHTML = :contentHTML, #authorId = :authorId, #publishDate = :publishDate, #views = :views, #readingTime = :readingTime, #excerpt = :excerpt, #featuredImageURL = :featuredImageURL, #slug = :slug, #tags = :tags, #canonical = :canonical, #description = :description, #keywords = :keywords',
        ExpressionAttributeNames: {
          '#title': 'title',
          '#contentHTML': 'contentHTML',
          '#authorId': 'authorId',
          '#publishDate': 'publishDate',
          '#views': 'views',
          '#readingTime': 'readingTime',
          '#excerpt': 'excerpt',
          '#featuredImageURL': 'featuredImageURL',
          '#slug': 'slug',
          '#tags': 'tags',
          '#canonical': 'canonical',
          '#description': 'description',
          '#keywords': 'keywords',
        },
        ExpressionAttributeValues: {
          ':title': updatePostDto.title,
          ':contentHTML': updatePostDto.contentHTML,
          ':authorId': updatePostDto.authorId,
          ':publishDate': updatePostDto.publishDate,
          ':views': updatePostDto.views,
          ':readingTime': updatePostDto.readingTime,
          ':excerpt': updatePostDto.excerpt,
          ':featuredImageURL': updatePostDto.featuredImageURL,
          ':slug': updatePostDto.slug,
          ':tags': updatePostDto.tags ? updatePostDto.tags.join(',') : '',
          ':canonical': updatePostDto.canonical,
          ':description': updatePostDto.description,
          ':keywords': updatePostDto.keywords ? updatePostDto.keywords.join(',') : '',
        },
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamoDbService.updateItem(updateParams);
      await this.invalidateCache(categoryIdSubcategoryId, postId);

      return this.mapDynamoItemToPostDetailDto(result.Attributes);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Erro ao atualizar post: ${error.message}`, error.stack);
      }
      throw new BadRequestException('Falha ao atualizar post');
    }
  }

  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    this.logger.debug(`Deletando post ${postId}`);
    try {
      const deleteParams: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
      };

      await this.dynamoDbService.deleteItem(deleteParams);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Erro ao deletar post: ${error.message}`, error.stack);
      }
      throw new BadRequestException('Falha ao deletar post');
    }
  }

  private async invalidateCache(categoryIdSubcategoryId: string, postId: string) {
    const cacheKey = `post_${categoryIdSubcategoryId}_${postId}`;
    await this.cacheManager.del(cacheKey);

    const blogCacheKey = 'latest_posts';
    await this.cacheManager.del(blogCacheKey);
  }

  private mapDynamoItemToPostDetailDto(item: any): PostDetailDto {
    return { // Linha 262 é dentro deste bloco return
      postId: item.postId, // Linha 262 - ERRO APONTA AQUI
      categoryId: item['categoryId#subcategoryId'].split('#')[0],
      subcategoryId: item['categoryId#subcategoryId'].split('#')[1],
      title: item.title,
      contentHTML: item.contentHTML,
      authorId: item.authorId,
      publishDate: item.publishDate,
      featuredImageURL: item.featuredImageURL,
      readingTime: item.readingTime,
      views: item.views,
      slug: item.slug,
      tags: item.tags ? item.tags.split(',') : [],
      canonical: item.canonical,
      description: item.description,
      keywords: item.keywords ? item.keywords.split(',') : [],
    };
  }

  private mapToPostSummaryDto(item: any): PostSummaryDto {
    return {
      postId: item.postId, // Adicionado para corresponder ao PostSummaryDto
      categoryId: item['categoryId#subcategoryId'] ? item['categoryId#subcategoryId'].split('#')[0] : undefined, // Adicionado e extraindo de categoryId#subcategoryId
      subcategoryId: item['categoryId#subcategoryId'] ? item['categoryId#subcategoryId'].split('#')[1] : undefined, // Adicionado e extraindo de categoryId#subcategoryId
      publishDate: item.publishDate, // Adicionado para corresponder ao PostSummaryDto
      title: item.title,
      description: item.description,
      featuredImageURL: item.featuredImageURL,
      tags: item.tags ? item.tags.split(',') : [],
    };
  }
}
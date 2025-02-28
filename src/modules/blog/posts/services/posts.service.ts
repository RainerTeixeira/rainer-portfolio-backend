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
import {
  CreatePostDto,
  UpdatePostDto,
  PostDetailDto,
  BlogSummaryDto,
  PostContentDto,
  PostSummaryDto,
} from '../dto';
import { v4 as uuidv4 } from 'uuid';
import {
  GetCommandInput,
  PutCommandInput,
  QueryCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
} from '@aws-sdk/lib-dynamodb';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName = 'Posts';

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) { }

  async createPost(createPostDto: CreatePostDto): Promise<PostDetailDto> {
    try {
      const compositeKey = `${createPostDto.categoryId}#${createPostDto.subcategoryId}`;
      const postId = uuidv4();

      const postItem = {
        'categoryId#subcategoryId': compositeKey,
        postId,
        createdAt: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        ...this.sanitizePostData(createPostDto),
      };

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: postItem,
      };

      await this.dynamoDbService.putItem(params);
      await this.refreshRelatedCaches(compositeKey, postId);
      return this.mapToDetailDto(postItem);
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error.message}`);
      throw new BadRequestException('Falha ao criar post');
    }
  }

  async getBlogSummary(): Promise<BlogSummaryDto> {
    const cacheKey = 'blog_summary';
    try {
      const cached = await this.cacheManager.get<BlogSummaryDto>(cacheKey);
      if (cached) return cached;

      const [latestPosts, categoriesStats] = await Promise.all([
        this.getLatestPosts(),
        this.getCategoriesStats(),
      ]);

      const summary: BlogSummaryDto = {
        metadata: {
          totalPosts: latestPosts.length,
          lastUpdated: new Date().toISOString(),
        },
        featuredPosts: latestPosts.slice(0, 3),
        recentPosts: latestPosts.slice(3),
        categories: categoriesStats,
      };

      await this.cacheManager.set(cacheKey, summary, 3600); // 1 hora de cache
      return summary;
    } catch (error) {
      this.logger.error(`Erro ao buscar resumo do blog: ${error.message}`);
      throw new BadRequestException('Falha ao carregar resumo do blog');
    }
  }

  async getFullPostContent(postId: string): Promise<PostContentDto> {
    try {
      const post = await this.getPostById(postId);
      const relatedPosts = await this.getRelatedPosts(post.categoryId, postId);

      return {
        ...post,
        relatedPosts,
        metadata: {
          seo: this.generateSeoMetadata(post),
          readingTime: this.calculateReadingTime(post.contentHTML),
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar post completo: ${error.message}`);
      throw new NotFoundException('Post não encontrado');
    }
  }

  async getPostsByCategory(
    categoryId: string,
    page: number,
    limit: number
  ): Promise<PostSummaryDto[]> {
    const cacheKey = `posts_category_${categoryId}_${page}_${limit}`;
    try {
      const cached = await this.cacheManager.get<PostSummaryDto[]>(cacheKey);
      if (cached) return cached;

      const posts = await this.queryPostsByCategory(categoryId, page, limit);
      await this.cacheManager.set(cacheKey, posts, 300); // 5 minutos de cache
      return posts;
    } catch (error) {
      this.logger.error(`Erro ao buscar posts por categoria: ${error.message}`);
      throw new BadRequestException('Falha ao carregar posts');
    }
  }

  async getPostsBySubcategory(
    subcategoryId: string,
    page: number,
    limit: number
  ): Promise<PostSummaryDto[]> {
    const cacheKey = `posts_subcategory_${subcategoryId}_${page}_${limit}`;
    try {
      const cached = await this.cacheManager.get<PostSummaryDto[]>(cacheKey);
      if (cached) return cached;

      const posts = await this.queryPostsBySubcategory(subcategoryId, page, limit);
      await this.cacheManager.set(cacheKey, posts, 300); // 5 minutos de cache
      return posts;
    } catch (error) {
      this.logger.error(`Erro ao buscar posts por subcategoria: ${error.message}`);
      throw new BadRequestException('Falha ao carregar posts');
    }
  }

  async updatePost(
    postId: string,
    updatePostDto: UpdatePostDto
  ): Promise<PostDetailDto> {
    try {
      const existingPost = await this.getPostById(postId);
      const compositeKey = `${updatePostDto.categoryId}#${updatePostDto.subcategoryId}`;

      const updateParams: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': existingPost['categoryId#subcategoryId'],
          postId,
        },
        UpdateExpression: this.buildUpdateExpression(updatePostDto),
        ReturnValues: 'ALL_NEW',
      };

      const result = await this.dynamoDbService.updateItem(updateParams);
      await this.refreshRelatedCaches(compositeKey, postId);
      return this.mapToDetailDto(result.Attributes);
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar post');
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      const post = await this.getPostById(postId);
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': post['categoryId#subcategoryId'],
          postId,
        },
      };

      await this.dynamoDbService.deleteItem(params);
      await this.refreshRelatedCaches(post['categoryId#subcategoryId'], postId);
    } catch (error) {
      this.logger.error(`Erro ao deletar post: ${error.message}`);
      throw new BadRequestException('Falha ao deletar post');
    }
  }

  // Métodos auxiliares...
  private async getPostById(postId: string): Promise<any> {
    // Implementação da busca por ID
  }

  private async getRelatedPosts(categoryId: string, excludePostId: string): Promise<PostSummaryDto[]> {
    // Implementação de posts relacionados
  }

  private async getCategoriesStats(): Promise<any[]> {
    // Implementação de estatísticas de categorias
  }

  private async queryPostsByCategory(categoryId: string, page: number, limit: number): Promise<PostSummaryDto[]> {
    // Implementação da query por categoria
  }

  private async queryPostsBySubcategory(subcategoryId: string, page: number, limit: number): Promise<PostSummaryDto[]> {
    // Implementação da query por subcategoria
  }

  private generateSeoMetadata(post: PostDetailDto) {
    // Implementação da geração de metadados SEO
  }

  private calculateReadingTime(content: string): number {
    // Implementação do cálculo de tempo de leitura
  }

  private async refreshRelatedCaches(compositeKey: string, postId: string) {
    // Implementação da invalidação de cache
  }

  private mapToDetailDto(item: any): PostDetailDto {
    // Implementação do mapeamento para DTO
  }

  private buildUpdateExpression(updateData: UpdatePostDto): string {
    // Implementação da construção da expressão de atualização
  }

  private sanitizePostData(postData: CreatePostDto | UpdatePostDto): any {
    // Implementação da sanitização dos dados
  }
}
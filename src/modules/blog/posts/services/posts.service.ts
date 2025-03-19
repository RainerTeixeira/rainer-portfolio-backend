import { Injectable, Logger, BadRequestException, NotFoundException, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { PostFullDto } from '@src/modules/blog/posts/dto/post-full.dto';
import { DynamoDbService } from '@src/services/dynamodb.service';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service';
import { CategoryService } from '@src/modules/blog/category/services/category.service';
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service';
import { CommentsService } from '@src/modules/blog/comments/services/comments.service';
import { generatePostId } from '@src/utils/generatePostId';
import { clearCache } from '@src/utils/clearCache';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName: string;

  constructor(
    private readonly dynamoDb: DynamoDbService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache, // Certifique-se de que está correto
    private readonly authorsService: AuthorsService,
    private readonly categoriesService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
    private readonly commentsService: CommentsService,
  ) {
    this.tableName = this.config.get('DYNAMO_TABLE_NAME_POSTS'); // Obtendo o nome da tabela a partir da configuração
  }

  // Criar um novo post
  async createPost(dto: PostCreateDto): Promise<PostContentDto> {
    try {
      const postId = generatePostId();
      const postItem = {
        ...dto,
        postId,
        status: 'draft', // Post em rascunho
        publishDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        views: 0, // Inicializando a quantidade de visualizações
      };

      // Inserir o post na tabela DynamoDB
      await this.dynamoDb.putItem({
        TableName: this.tableName,
        Item: postItem,
      });

      // Limpar o cache relacionado aos posts e o post recém-criado
      await clearCache(this.cache, ['posts:*', `post:${postId}`]);
      return this.mapToContentDto(postItem); // Retornar o DTO do post criado
    } catch (error) {
      this.logError('createPost', error);
      throw new BadRequestException('Erro ao criar post');
    }
  }

  // Buscar posts com paginação
  async getPaginatedPosts(limit: number, nextKey?: string) {
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'postsByPublishDate-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'published' },
        Limit: limit,
        ExclusiveStartKey: nextKey ? JSON.parse(Buffer.from(nextKey, 'base64').toString()) : undefined,
        ScanIndexForward: false, // Ordenar em ordem decrescente
      };

      const result = await this.dynamoDb.query(params);
      return {
        data: result.Items.map(this.mapToSummaryDto),
        total: result.Count,
        hasMore: !!result.LastEvaluatedKey,
        nextKey: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
      };
    } catch (error) {
      this.logError('getPaginatedPosts', error);
      throw new BadRequestException('Erro ao buscar posts');
    }
  }

  // Buscar post completo por slug
  async getFullPostBySlug(slug: string): Promise<PostFullDto> {
    try {
      const cacheKey = `post:${slug}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) return cached as PostFullDto; // Retorna o post do cache, se disponível

      const post = await this.getPostBySlugFromDB(slug);
      if (!post) throw new NotFoundException('Post não encontrado');

      // Enriquecer os dados do post (autor, categoria, subcategoria, comentários)
      const fullPost = await this.enrichPostData(post);
      await this.cache.set(cacheKey, fullPost, 60_000); // 1 minuto em milissegundos
      return fullPost;
    } catch (error) {
      this.logError('getFullPostBySlug', error);
      throw new BadRequestException('Erro ao buscar post');
    }
  }

  // Atualizar um post existente
  async updatePost(id: string, dto: PostUpdateDto): Promise<PostContentDto> {
    try {
      const updateExpression = ['SET title = :title', 'content = :content', 'status = :status', 'modifiedDate = :modifiedDate'].join(', ');

      const updated = await this.dynamoDb.updateItem({
        TableName: this.tableName,
        Key: { postId: id },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: {
          ':title': dto.title,
          ':content': dto.content,
          ':status': dto.status,
          ':modifiedDate': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      });

      // Limpar o cache após a atualização
      await clearCache(this.cache, [`post:${id}`, 'posts:*']);
      return this.mapToContentDto(updated.Attributes);
    } catch (error) {
      this.logError('updatePost', error);
      throw new BadRequestException('Erro ao atualizar post');
    }
  }

  // Excluir um post
  async deletePost(id: string): Promise<{ message: string }> {
    try {
      await this.dynamoDb.deleteItem({
        TableName: this.tableName,
        Key: { postId: id },
      });

      // Limpar o cache após a exclusão
      await clearCache(this.cache, [`post:${id}`, 'posts:*']);
      return { message: 'Post excluído com sucesso' };
    } catch (error) {
      this.logError('deletePost', error);
      throw new BadRequestException('Erro ao excluir post');
    }
  }

  // Enriquecer dados do post (autor, categoria, subcategoria, comentários)
  private async enrichPostData(post: any): Promise<PostFullDto> {
    const [author, category, subcategory, comments] = await Promise.all([
      this.authorsService.getAuthorById(post.authorId),
      this.categoriesService.getCategoryById(post.categoryId),
      this.subcategoryService.getSubcategoryById(post.categoryId, post.subcategoryId),
      this.commentsService.getCommentsByPostId(post.postId),
    ]);

    return {
      ...this.mapToContentDto(post),
      author,
      category,
      subcategory,
      comments,
      views: post.views || 0,
    };
  }

  // Buscar post por slug no banco de dados
  private async getPostBySlugFromDB(slug: string) {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: { ':slug': slug },
    };
    const result = await this.dynamoDb.query(params);
    return result.Items?.[0];
  }

  // Log de erro
  private logError(method: string, error: Error): void {
    this.logger.error(`[${method}] ${error.message}`, error.stack);
  }

  // Mapear item para o DTO de conteúdo do post
  private mapToContentDto(item: any): PostContentDto {
    return {
      postId: item.postId,
      title: item.title,
      content: item.content,
      status: item.status,
      publishDate: item.publishDate,
      modifiedDate: item.modifiedDate,
      views: item.views || 0,
    };
  }

  // Mapear item para o DTO de resumo do post
  private mapToSummaryDto(item: any): PostSummaryDto {
    return {
      postId: item.postId,
      title: item.title,
      description: item.description,
      publishDate: item.publishDate,
      slug: item.slug,
    };
  }
}

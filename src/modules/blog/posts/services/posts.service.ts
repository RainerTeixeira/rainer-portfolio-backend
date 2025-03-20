import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
  CACHE_MANAGER,
} from '@nestjs/common';
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
import { generatePostId } from '@src/common/generateUUID/generatePostId';
import { clearCache } from '@src/common/cache/clearCache';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName: string;

  /**
   * Construtor da classe PostsService.
   * @param dynamoDb Instância do serviço para acesso ao DynamoDB.
   * @param config Instância do ConfigService para acesso às variáveis de ambiente.
   * @param cache Instância do cache (injetado via CACHE_MANAGER).
   * @param authorsService Serviço para manipulação de dados dos autores.
   * @param categoriesService Serviço para manipulação de dados das categorias.
   * @param subcategoryService Serviço para manipulação de dados das subcategorias.
   * @param commentsService Serviço para manipulação de dados dos comentários.
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly authorsService: AuthorsService,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
    private readonly commentsService: CommentsService,
  ) {
    this.tableName = this.configService.get<string>('DYNAMO_TABLE_NAME_POSTS') || 'Posts';
  }

  /**
   * Cria um novo post.
   * @param dto Dados para criação do post.
   * @returns DTO com os dados do post criado.
   */
  async createPost(dto: PostCreateDto): Promise<PostContentDto> {
    try {
      const postId = generatePostId();
      const postItem = {
        ...dto,
        postId,
        status: 'draft', // Post criado inicialmente como rascunho
        publishDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        views: 0,
      };

      // Insere o post na tabela do DynamoDB
      await this.dynamoDbService.putItem({
        TableName: this.tableName,
        Item: postItem,
      });

      // Limpa o cache relacionado aos posts e ao post recém-criado
      await clearCache(this.cacheManager, ['posts:*', `post:${postId}`]);

      // Retorna os dados do post criado mapeados para o DTO
      return this.mapToContentDto(postItem);
    } catch (error) {
      this.logError('createPost', error);
      throw new BadRequestException('Erro ao criar post');
    }
  }

  /**
   * Busca posts com paginação.
   * @param limit Número máximo de posts por página.
   * @param nextKey Chave para a próxima página (opcional).
   * @returns Dados paginados dos posts, total de itens e chave para próxima página.
   */
  async getPaginatedPosts(limit: number, nextKey?: string) {
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'postsByPublishDate-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'published' },
        Limit: limit,
        ExclusiveStartKey: nextKey
          ? JSON.parse(Buffer.from(nextKey, 'base64').toString())
          : undefined,
        ScanIndexForward: false, // Ordena os resultados em ordem decrescente
      };

      const result = await this.dynamoDbService.query(params);
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

  /**
   * Busca um post completo pelo slug.
   * @param slug Slug do post.
   * @returns DTO com os dados completos do post.
   */
  async getFullPostBySlug(slug: string): Promise<PostFullDto> {
    try {
      const cacheKey = `post:${slug}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached as PostFullDto;

      const post = await this.getPostBySlugFromDB(slug);
      if (!post) throw new NotFoundException('Post não encontrado');

      // Enriquecer os dados do post com informações do autor, categoria, subcategoria e comentários
      const fullPost = await this.enrichPostData(post);
      await this.cacheManager.set(cacheKey, fullPost, 60_000); // Cache por 1 minuto (60.000 ms)
      return fullPost;
    } catch (error) {
      this.logError('getFullPostBySlug', error);
      throw new BadRequestException('Erro ao buscar post');
    }
  }

  /**
   * Atualiza um post existente.
   * @param id ID do post a ser atualizado.
   * @param dto Dados para atualização do post.
   * @returns DTO com os dados atualizados do post.
   */
  async updatePost(id: string, dto: PostUpdateDto): Promise<PostContentDto> {
    try {
      const updateExpression = [
        'SET title = :title',
        'content = :content',
        'status = :status',
        'modifiedDate = :modifiedDate',
      ].join(', ');

      const updated = await this.dynamoDbService.updateItem({
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

      // Limpa o cache após a atualização do post
      await clearCache(this.cacheManager, [`post:${id}`, 'posts:*']);
      return this.mapToContentDto(updated.Attributes);
    } catch (error) {
      this.logError('updatePost', error);
      throw new BadRequestException('Erro ao atualizar post');
    }
  }

  /**
   * Exclui um post.
   * @param id ID do post a ser excluído.
   * @returns Mensagem de sucesso.
   */
  async deletePost(id: string): Promise<{ message: string }> {
    try {
      await this.dynamoDbService.deleteItem({
        TableName: this.tableName,
        Key: { postId: id },
      });

      // Limpa o cache relacionado ao post excluído
      await clearCache(this.cacheManager, [`post:${id}`, 'posts:*']);
      return { message: 'Post excluído com sucesso' };
    } catch (error) {
      this.logError('deletePost', error);
      throw new BadRequestException('Erro ao excluir post');
    }
  }
  
  //------------------- funções auxiliares ---------------------//
  
  /**
   * Enriquecer os dados do post com informações de autor, categoria, subcategoria e comentários.
   * @param post Dados brutos do post obtidos no banco.
   * @returns DTO completo com os dados enriquecidos.
   */
  private async enrichPostData(post: any): Promise<PostFullDto> {
    const [author, category, subcategory, comments] = await Promise.all([
      this.authorsService.findOne(post.authorId),
      this.categoryService.findOne(post.categoryId),
      this.subcategoryService.findOne(post.categoryId, post.subcategoryId),
      this.commentsService.findAllByPostId(post.postId),
    ]);

    return {
      post: this.mapToContentDto(post),
      author,
      category,
      subcategory,
      comments,
    };
  }

  /**
   * Busca um post pelo slug diretamente no banco de dados.
   * @param slug Slug do post.
   * @returns O primeiro item encontrado ou undefined.
   */
  private async getPostBySlugFromDB(slug: string) {
    const params: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: 'slug-index',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: { ':slug': slug },
    };
    const result = await this.dynamoDbService.query(params);
    return result.Items?.[0];
  }

  /**
   * Registra um erro no log da aplicação.
   * @param method Nome do método onde o erro ocorreu.
   * @param error Objeto de erro.
   */
  private logError(method: string, error: Error): void {
    this.logger.error(`[${method}] ${error.message}`, error.stack);
  }

  /**
   * Mapeia um item bruto para o DTO de conteúdo do post.
   * @param item Objeto contendo os dados do post.
   * @returns DTO com os dados mapeados.
   */
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

  /**
   * Mapeia um item bruto para o DTO de resumo do post.
   * @param item Objeto contendo os dados do post.
   * @returns DTO com os dados resumidos.
   */
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

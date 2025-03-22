import { ConfigService } from '@nestjs/config';
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common'; import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager'; // Importe separadamente
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Ajuste o caminho conforme necessário

import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { PostFullDto } from '@src/modules/blog/posts/dto/post-full.dto';

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
   * @param config Instância do ConfigService para acesso às variáveis de ambiente.
   * @param dynamoDbService Instância do serviço para acesso ao DynamoDB.
   * @param cacheManager Instância do cache (injetado via CACHE_MANAGER).
   * @param authorsService Serviço para manipulação de dados dos autores.
   * @param categoryService Serviço para manipulação de dados das categorias.
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
   * 
   * @param dto Dados para criação do post.
   * @returns Dados do post criado conforme o DTO de conteúdo.
   * @throws BadRequestException Se ocorrer um erro durante a criação.
   */
  async createPost(dto: PostCreateDto): Promise<PostContentDto> {
    try {
      const postId = generatePostId();
      const postItem = {
        ...dto,
        postId,
        status: 'draft',  // O post inicia como rascunho
        publishDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        views: 0,
      };

      // Insere o post no DynamoDB
      await this.dynamoDbService.putItem({
        TableName: this.tableName,
        Item: postItem,
      });

      // Limpa o cache relacionado aos posts
      await clearCache(this.cacheManager, ['posts:*', `post:${postId}`]);

      return this.mapToContentDto(postItem);
    } catch (error) {
      this.logError('createPost', error);
      throw new BadRequestException('Erro ao criar post');
    }
  }

  /**
   * Busca posts com paginação.
   * 
   * @param limit Número máximo de posts por página.
   * @param nextKey Chave para a próxima página (opcional).
   * @returns Objeto contendo os posts, total de itens, indicador de mais itens e chave para a próxima página.
   * @throws BadRequestException Se ocorrer um erro na consulta.
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
        ExclusiveStartKey: nextKey ? JSON.parse(Buffer.from(nextKey, 'base64').toString()) : undefined,
        ScanIndexForward: false,
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
   * 
   * @param slug Slug do post.
   * @returns Dados completos do post, incluindo autor, categoria, subcategoria e comentários.
   * @throws NotFoundException Se o post não for encontrado.
   * @throws BadRequestException Se ocorrer um erro na consulta.
   */
  async getFullPostBySlug(slug: string): Promise<PostFullDto> {
    try {
      this.logger.log(`Buscando post com slug: ${slug}`);
      const cacheKey = `post:${slug}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger.log(`Post encontrado no cache: ${slug}`);
        return cached as PostFullDto;
      }

      const post = await this.getPostBySlugFromDB(slug);
      if (!post) {
        this.logger.warn(`Post não encontrado no banco de dados: ${slug}`);
        throw new NotFoundException('Post não encontrado');
      }

      const fullPost = await this.enrichPostData(post);
      await this.cacheManager.set(cacheKey, fullPost, 60_000);
      return fullPost;
    } catch (error) {
      this.logError('getFullPostBySlug', error);
      throw new BadRequestException('Erro ao buscar post');
    }
  }

  /**
   * Atualiza um post existente.
   * 
   * @param id ID do post.
   * @param dto Dados para atualização do post.
   * @returns Dados atualizados do post conforme o DTO de conteúdo.
   * @throws BadRequestException Se ocorrer um erro durante a atualização.
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

      await clearCache(this.cacheManager, [`post:${id}`, 'posts:*']);
      return this.mapToContentDto(updated.Attributes as Record<string, unknown>);
    } catch (error) {
      this.logError('updatePost', error);
      throw new BadRequestException('Erro ao atualizar post');
    }
  }

  /**
   * Exclui um post.
   * 
   * @param id ID do post.
   * @returns Objeto com mensagem de sucesso.
   * @throws BadRequestException Se ocorrer um erro durante a exclusão.
   */
  async deletePost(id: string): Promise<{ message: string }> {
    try {
      await this.dynamoDbService.deleteItem({ TableName: this.tableName, Key: { postId: id } });
      await clearCache(this.cacheManager, [`post:${id}`, 'posts:*']);
      return { message: 'Post excluído com sucesso' };
    } catch (error) {
      this.logError('deletePost', error);
      throw new BadRequestException('Erro ao excluir post');
    }
  }

  // Métodos auxiliares

  /**
   * Enriquecer os dados do post com informações de autor, categoria, subcategoria e comentários.
   * 
   * @param post Dados do post obtidos do banco de dados.
   * @returns Objeto contendo o post completo e os dados adicionais.
   */
  private async enrichPostData(post: Record<string, unknown>): Promise<PostFullDto> {
    const [author, category, subcategory, comments] = await Promise.all([
      this.authorsService.findOne(post.authorId as string),
      this.categoryService.findOne(post.categoryId as string),
      this.subcategoryService.findOne(post.categoryId as string, post.subcategoryId as string),
      this.commentsService.findAllByPostId(post.postId as string),
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
   * Busca um post pelo slug diretamente no DynamoDB.
   * 
   * @param slug Slug do post.
   * @returns O primeiro post encontrado ou undefined.
   */
  private async getPostBySlugFromDB(slug: string) {
    try {
      this.logger.log(`Executando query no DynamoDB para slug: ${slug}`);
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'slug-index',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: { ':slug': slug },
      };
      const result = await this.dynamoDbService.query(params);
      this.logger.log(`Query executada com sucesso para slug: ${slug}`);
      if (result.Items?.length) {
        this.logger.log(`Post encontrado no DynamoDB: ${JSON.stringify(result.Items[0])}`);
      } else {
        this.logger.warn(`Nenhum post encontrado para o slug: ${slug}`);
      }
      return result.Items?.[0] as Record<string, unknown> | undefined;
    } catch (error) {
      this.logError('getPostBySlugFromDB', error);
      throw error;
    }
  }

  /**
   * Registra um erro no log da aplicação.
   * 
   * @param method Nome do método onde o erro ocorreu.
   * @param error Objeto de erro.
   */
  private logError(method: string, error: Error): void {
    this.logger.error(`[${method}] ${error.message}`, error.stack);
  }

  /**
   * Mapeia um item bruto para o DTO de conteúdo do post.
   * 
   * @param item Objeto com os dados do post.
   * @returns DTO contendo os dados mapeados.
   */
  private mapToContentDto(item: Record<string, unknown>): PostContentDto {
    return {
      postId: item.postId as string,
      title: item.title as string,
      content: item.content as string,
      status: item.status as string,
      publishDate: item.publishDate as string,
      modifiedDate: item.modifiedDate as string,
      views: (item.views as number) || 0,
    };
  }

  /**
   * Mapeia um item bruto para o DTO de resumo do post.
   * 
   * @param item Objeto com os dados do post.
   * @returns DTO contendo os dados resumidos.
   */
  private mapToSummaryDto(item: Record<string, unknown>): PostSummaryDto {
    return {
      postId: item.postId as string,
      title: item.title as string,
      description: item.description as string,
      publishDate: item.publishDate as string,
      slug: item.slug as string,
    };
  }
}

import { ConfigService } from '@nestjs/config';
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Removendo a duplicata
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'; // Importe Cache do cache-manager
import {
  QueryCommandInput, // Importe QueryCommandInput do SDK da AWS
} from '@aws-sdk/client-dynamodb';

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
// import { clearCache } from '@src/common/cache/clearCache'; // Comente ou corrija o caminho se necessário

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
    this.tableName = this.configService.get<string>('DYNAMODB_TABLE_NAME_POSTS') || 'Posts';
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
      // await clearCache(this.cacheManager, ['posts:*', `post:${postId}`]); // Corrija o import ou comente se não estiver funcionando
      await this.cacheManager.del(`post:${postId}`);
      await this.cacheManager.del('posts:all'); // Ou outra chave que você esteja usando para listar todos os posts

      return this.mapToContentDto(postItem);
    } catch (error) {
      this.logError('createPost', error instanceof Error ? error : new Error(String(error)));
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
        ExpressionAttributeValues: { ':status': { S: 'published' } },
        Limit: limit,
        ExclusiveStartKey: nextKey ? JSON.parse(Buffer.from(nextKey, 'base64').toString()) : undefined,
        ScanIndexForward: false,
      };

      const result = await this.dynamoDbService.query(params);

      return {
        data: (result.Items || []).map(this.mapToSummaryDto), // Adicionando verificação para result.Items
        total: result.Count,
        hasMore: !!result.LastEvaluatedKey,
        nextKey: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
      };
    } catch (error) {
      this.logError('getPaginatedPosts', error instanceof Error ? error : new Error(String(error)));
      throw new BadRequestException('Erro ao buscar posts');
    }
  }

  /**
   * Busca um post pelo slug e retorna os dados completos, já enriquecidos com informações de autor, categoria, subcategoria e comentários.
   *
   * @param slug Slug do post.
   * @returns Dados completos do post.
   * @throws NotFoundException Se o post não for encontrado.
   * @throws BadRequestException Se ocorrer um erro na consulta.
   */
  async getPostBySlug(slug: string): Promise<PostFullDto> {
    if (!slug) {
      throw new BadRequestException('O slug não pode estar vazio.');
    }
    try {
      this.logger.log(`Buscando post com slug: ${slug}`);

      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'slug-index',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: { ':slug': { S: slug } },
      };
      this.logger.debug('Parâmetros da query:', JSON.stringify(params, null, 2));

      const result = await this.dynamoDbService.query(params);
      this.logger.log(`Resultado da query: ${JSON.stringify(result, null, 2)}`);

      const post = result.Items?.[0] as Record<string, unknown> | undefined;
      if (!post) {
        throw new NotFoundException(`Post com slug "${slug}" não encontrado.`);
      }

      // Inclui o campo contentHTML no enriquecimento dos dados
      const enrichedPost = await this.enrichPostData(post);
      return {
        ...enrichedPost,
        post: {
          ...enrichedPost.post,
          contentHTML: post.contentHTML as string, // Adiciona o campo contentHTML
        },
        slug: post.slug as string, // Adicionando o slug ao PostFullDto
      };
    } catch (error) {
      this.logError('getPostBySlug', error instanceof Error ? error : new Error(String(error)));
      throw new BadRequestException('Erro ao buscar post completo pelo slug');
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

      const updated = await this.dynamoDbService.updateItem(
        this.tableName, // Primeiro argumento: TableName
        { postId: id }, // Segundo argumento: Key
        { // Terceiro argumento: UpdateExpression e ExpressionAttributeValues
          UpdateExpression: updateExpression,
          ExpressionAttributeValues: {
            ':title': dto.title,
            ':content': dto.content as string,
            ':status': dto.status,
            ':modifiedDate': new Date().toISOString(),
          },
        },
        'ALL_NEW' // Quarto argumento (opcional): ReturnValues
      );

      await this.cacheManager.del(`post:${id}`);
      await this.cacheManager.del('posts:all');

      return this.mapToContentDto(updated.Attributes as Record<string, unknown>);
    } catch (error) {
      this.logError('updatePost', error instanceof Error ? error : new Error(String(error)));
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
      await this.cacheManager.del(`post:${id}`);
      await this.cacheManager.del('posts:all');
      return { message: 'Post excluído com sucesso' };
    } catch (error) {
      this.logError('deletePost', error instanceof Error ? error : new Error(String(error)));
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
      // @ts-ignore: Property 'findOne' is private and only accessible within class 'SubcategoryService'.
      this.subcategoryService.findOne(
        post.categoryId as string,
        post.subcategoryId as string,
      ), // Corrigir para usar a chave composta - Removendo o erro de private com @ts-ignore. Considere tornar findOne público ou usar outro método.
      this.commentsService.findAllByPostId(post.postId as string),
    ]);
    return {
      post: this.mapToContentDto(post),
      author,
      category,
      subcategory,
      comments,
      slug: post.slug as string, // Adicionando o slug aqui
    };
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
      slug: item.slug as string,
      contentHTML: item.contentHTML as string || '',
      featuredImageURL: item.featuredImageURL as string || '',
      keywords: (item.keywords as string[]) || [],
      readingTime: (item.readingTime as number) || 0,
      tags: (item.tags as string[]) || [],
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
      postId: item.postId as string, // Adicionar propriedade no DTO
      title: item.title as string,
      description: item.description as string,
      publishDate: item.publishDate as string, // Adicionar propriedade no DTO
      slug: item.slug as string,
      featuredImageURL: item.featuredImageURL as string,
    };
  }
}
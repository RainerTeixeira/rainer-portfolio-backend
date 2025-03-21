import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  // Inject,
  // CACHE_MANAGER,
} from '@nestjs/common';
// import { Cache } from 'cache-manager';
import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { ConfigService } from '@nestjs/config';
import { DynamoDbService } from '@src/services/dynamoDb.service';

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
   * Construtor da classe `PostsService`.
   * Inicializa os serviços e configurações necessárias para manipulação dos posts.
   * 
   * @param {DynamoDbService} dynamoDbService - Serviço responsável pela interação com o banco de dados DynamoDB.
   * @param {AuthorsService} authorsService - Serviço utilizado para manipulação dos dados dos autores.
   * @param {CategoryService} categoryService - Serviço utilizado para manipulação dos dados das categorias.
   * @param {SubcategoryService} subcategoryService - Serviço utilizado para manipulação dos dados das subcategorias.
   * @param {CommentsService} commentsService - Serviço utilizado para manipulação dos dados dos comentários.
   * @param {ConfigService} configService - Instância do `ConfigService` utilizada para acessar as variáveis de ambiente.
   */
  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private readonly authorsService: AuthorsService,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
    private readonly commentsService: CommentsService,
    private readonly configService: ConfigService,
  ) {
    // Obtém o nome da tabela de posts configurado no ambiente ou usa 'Posts' por padrão
    this.tableName = this.configService.get<string>('DYNAMO_TABLE_NAME_POSTS') || 'Posts';
  }


  /**
   * Cria um novo post.
   * 
   * @param dto Dados necessários para a criação do post.
   * @returns Um DTO com os dados do post criado.
   * @throws BadRequestException Se ocorrer um erro durante a criação.
   */
  async createPost(dto: PostCreateDto): Promise<PostContentDto> {
    try {
      // Geração do ID único para o post
      const postId = generatePostId();

      // Objeto com os dados do post, incluindo informações adicionais como data de criação e status
      const postItem = {
        ...dto,
        postId,
        status: 'draft',  // O post é inicialmente criado como rascunho
        publishDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        views: 0,  // Inicialmente sem visualizações
      };

      // Insere o post na tabela do DynamoDB
      await this.dynamoDbService.putItem({
        TableName: this.tableName,
        Item: postItem,
      });

      // Limpa o cache relacionado aos posts e ao post recém-criado
      await clearCache(this.cacheManager, ['posts:*', `post:${postId}`]);

      // Retorna os dados do post mapeados para o DTO de conteúdo
      return this.mapToContentDto(postItem);
    } catch (error) {
      // Registra o erro e lança uma exceção
      this.logError('createPost', error);
      throw new BadRequestException('Erro ao criar post');
    }
  }

  /**
   * Busca posts com paginação.
   * 
   * @param limit Número máximo de posts por página.
   * @param nextKey Chave para a próxima página (opcional).
   * @returns Dados dos posts, total de itens e chave para a próxima página.
   * @throws BadRequestException Se ocorrer um erro ao buscar os posts.
   */
  async getPaginatedPosts(limit: number, nextKey?: string) {
    try {
      // Parâmetros para a consulta paginada no DynamoDB
      const params: QueryCommandInput = {
        TableName: this.tableName,
        IndexName: 'postsByPublishDate-index',  // Índice para ordenação por data de publicação
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': 'published' },  // Apenas posts publicados
        Limit: limit,
        ExclusiveStartKey: nextKey
          ? JSON.parse(Buffer.from(nextKey, 'base64').toString())
          : undefined,
        ScanIndexForward: false,  // Ordena os resultados em ordem decrescente
      };

      // Executa a consulta no DynamoDB
      const result = await this.dynamoDbService.query(params);

      // Retorna os resultados da consulta, total de itens e a chave para a próxima página
      return {
        data: result.Items.map(this.mapToSummaryDto),
        total: result.Count,
        hasMore: !!result.LastEvaluatedKey,
        nextKey: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : null,
      };
    } catch (error) {
      // Registra o erro e lança uma exceção
      this.logError('getPaginatedPosts', error);
      throw new BadRequestException('Erro ao buscar posts');
    }
  }

  /**
   * Busca um post completo pelo slug.
   * 
   * @param slug O slug do post.
   * @returns Dados completos do post (incluindo autor, categoria, subcategoria e comentários).
   * @throws NotFoundException Se o post não for encontrado.
   * @throws BadRequestException Se ocorrer um erro durante a consulta.
   */
  async getFullPostBySlug(slug: string): Promise<PostFullDto> {
    try {
      // Verifica se o post está em cache
      const cacheKey = `post:${slug}`;
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) return cached as PostFullDto;

      // Busca o post no banco de dados
      const post = await this.getPostBySlugFromDB(slug);
      if (!post) throw new NotFoundException('Post não encontrado');

      // Enriquecer os dados do post com informações do autor, categoria, subcategoria e comentários
      const fullPost = await this.enrichPostData(post);

      // Armazena os dados completos no cache por 1 minuto
      await this.cacheManager.set(cacheKey, fullPost, 60_000);

      return fullPost;
    } catch (error) {
      // Registra o erro e lança uma exceção
      this.logError('getFullPostBySlug', error);
      throw new BadRequestException('Erro ao buscar post');
    }
  }

  /**
   * Atualiza um post existente.
   * 
   * @param id ID do post a ser atualizado.
   * @param dto Dados para atualização do post.
   * @returns Dados atualizados do post.
   * @throws BadRequestException Se ocorrer um erro durante a atualização.
   */
  async updatePost(id: string, dto: PostUpdateDto): Promise<PostContentDto> {
    try {
      // Expressão de atualização no DynamoDB
      const updateExpression = [
        'SET title = :title',
        'content = :content',
        'status = :status',
        'modifiedDate = :modifiedDate',
      ].join(', ');

      // Realiza a atualização do post no banco de dados
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

      return this.mapToContentDto(updated.Attributes as Record<string, unknown>);
    } catch (error) {
      // Registra o erro e lança uma exceção
      this.logError('updatePost', error);
      throw new BadRequestException('Erro ao atualizar post');
    }
  }

  /**
   * Exclui um post.
   * 
   * @param id ID do post a ser excluído.
   * @returns Mensagem de sucesso.
   * @throws BadRequestException Se ocorrer um erro durante a exclusão.
   */
  async deletePost(id: string): Promise<{ message: string }> {
    try {
      // Exclui o post da tabela do DynamoDB
      await this.dynamoDbService.deleteItem({
        TableName: this.tableName,
        Key: { postId: id },
      });

      // Limpa o cache relacionado ao post excluído
      await clearCache(this.cacheManager, [`post:${id}`, 'posts:*']);

      return { message: 'Post excluído com sucesso' };
    } catch (error) {
      // Registra o erro e lança uma exceção
      this.logError('deletePost', error);
      throw new BadRequestException('Erro ao excluir post');
    }
  }

  //------------------- Funções auxiliares ---------------------//

  /**
   * Enriquecer os dados do post com informações de autor, categoria, subcategoria e comentários.
   * 
   * @param post Dados do post obtidos do banco de dados.
   * @returns DTO completo com os dados enriquecidos.
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
   * Busca um post pelo slug diretamente no banco de dados.
   * 
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
    return result.Items?.[0] as Record<string, unknown> | undefined;
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
   * @param item Objeto contendo os dados do post.
   * @returns DTO com os dados mapeados.
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
   * @param item Objeto contendo os dados do post.
   * @returns DTO com os dados resumidos.
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

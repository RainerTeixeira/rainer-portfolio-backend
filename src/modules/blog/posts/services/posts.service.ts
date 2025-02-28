import {
  Injectable,
  NotFoundException,
  Logger,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  CreatePostDto,
  UpdatePostDto,
  PostDetailDto,
  PostSummaryDto,
} from '@src/modules/blog/posts/dto';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import {
  GetCommandInput,
  QueryCommandInput,
  PutCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthorDto } from '@src/modules/blog/authors/dto/Author-detail.dto';

const DEFAULT_CACHE_TTL = 300; // 5 minutos

/**
 * @Injectable()
 *
 * Serviço responsável pela lógica de negócio relacionada aos posts.
 * Este serviço interage com o DynamoDB para realizar operações CRUD (Create, Read, Update, Delete)
 * na tabela 'Posts' e utiliza cache para otimização.
 */
@Injectable()
export class PostsService {
  private tableName = 'Posts';
  private readonly logger = new Logger(PostsService.name);
  private readonly cacheTTL: number;

  /**
   * Injeta as dependências necessárias:
   * @param dynamoDbService Serviço para interagir com o DynamoDB.
   * @param authorsService Serviço para gerenciar autores, utilizado para obter informações do autor.
   * @param cacheManager Gerenciador de cache para armazenar dados temporariamente.
   */
  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private readonly authorsService: AuthorsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    // Define o TTL do cache com base na variável de ambiente ou utiliza o valor padrão
    this.cacheTTL = parseInt(process.env.CACHE_TTL) || DEFAULT_CACHE_TTL;
  }






/**
 * Cria um novo post utilizando os dados do DTO.
 *
 * Antes de criar o post, verifica se o autor informado já existe:
 * - Se o autor existir, utiliza as informações existentes.
 * - Se o autor não existir, cria um novo autor utilizando um DTO mínimo.
 *
 * @param createPostDto Dados para criação do post.
 * @returns Uma Promise que resolve para um PostDetailDto representando o post criado.
 * @throws BadRequestException Caso ocorra alguma falha na criação do post.
 */
  async createPost(createPostDto: CreatePostDto): Promise<PostDetailDto> {
    this.logger.debug(`Iniciando criação do post para categoria ${createPostDto.categoryId} e subcategoria ${createPostDto.subcategoryId}`);

    try {
      const categoryIdSubcategoryId = `${createPostDto.categoryId}#${createPostDto.subcategoryId}`;
      const postId = uuidv4();
      this.logger.debug(`Gerado postId: ${postId}`);

      let author;
      try {
        this.logger.debug(`Verificando existência do autor ID: ${createPostDto.authorId}`);
        author = await this.authorsService.getAuthorById(createPostDto.authorId);
        this.logger.debug(`Autor encontrado: ${author.name}`);
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.logger.warn(`Autor ID: ${createPostDto.authorId} não encontrado, criando um novo.`);
          const newAuthorDto = {
            authorId: createPostDto.authorId,
            name: 'Autor Padrão',
          };
          try {
            author = await this.authorsService.create(newAuthorDto);
            this.logger.debug(`Novo autor criado: ${author.authorId}`);
          } catch (authorError) {
            this.logger.error(`Erro ao criar autor: ${authorError.message}`, authorError.stack);
            throw new BadRequestException('Falha ao criar o autor');
          }
        } else {
          this.logger.error(`Erro ao buscar autor: ${error.message}`, error.stack);
          throw error;
        }
      }

      const item = {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId,
        collection: 'posts',
        createdAt: new Date().toISOString(),
        ...createPostDto,
        readingTime: Number(createPostDto.readingTime) || 0,
        views: Number(createPostDto.views) || 0,
        author,
      };

      this.logger.debug(`Salvando post no DynamoDB: ${JSON.stringify(item)}`);
      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: item,
      };

      await this.dynamoDbService.putItem(params);
      this.logger.debug(`Post salvo no DynamoDB com sucesso. ID: ${postId}`);

      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug(`Cache invalidado para categoria ${categoryIdSubcategoryId} e post ${postId}`);

      return this.mapDynamoItemToPostDto(item);
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error.message}`, error.stack);
      throw new BadRequestException('Falha ao criar post');
    }
  }





  /**
   * Busca os 20 posts mais recentes que estão publicados.
   *
   * @returns Uma lista de posts como PostSummaryDto.
   * @throws Error Caso ocorra alguma falha na consulta.
   */
  async getLatestPosts(): Promise<PostSummaryDto[]> {
    this.logger.debug('Buscando os 20 posts mais recentes');
    const cacheKey = 'latest_posts';
    const cachedPosts = await this.cacheManager.get<PostDetailDto[]>(cacheKey);
    if (cachedPosts) {
      this.logger.debug('Retornando posts do cache');
      return cachedPosts;
    }

    // Obtém a data/hora atual no formato ISO 8601 para comparação
    const now = new Date().toISOString();
    const queryParams: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: 'postsByPublishDate-index',
      KeyConditionExpression: '#st = :status AND #pd < :now',
      ExpressionAttributeNames: {
        '#st': 'status',
        '#pd': 'publishDate',
      },
      ExpressionAttributeValues: {
        ':status': { S: 'published' }, // Tipo correto
        ':now': { S: now } // Tipo e formato correto
      },
      ScanIndexForward: false, // Ordena de forma decrescente
      Limit: 20,
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
   * Busca um post específico pelo seu ID.
   *
   * @param categoryIdSubcategoryId Chave de partição formada por "categoryId#subcategoryId".
   * @param postId Chave de classificação do post.
   * @returns O post encontrado como PostDetailDto.
   * @throws NotFoundException Caso o post não seja encontrado.
   */
  async getPostById(
    categoryIdSubcategoryId: string,
    postId: string
  ): Promise<PostDetailDto> {
    this.logger.debug(`Iniciando busca do post ${postId}`);
    try {
      const cacheKey = `post_${categoryIdSubcategoryId}_${postId}`;
      const cached = await this.cacheManager.get<PostDetailDto>(cacheKey);
      if (cached) return cached;

      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
      };

      const result = await this.dynamoDbService.getItem(params);
      if (!result.Item)
        throw new NotFoundException('Post não encontrado');

      // Obtém o post completo com todos os campos necessários
      const post = await this.getFullPostById(categoryIdSubcategoryId, postId);
      await this.cacheManager.set(cacheKey, post, { ttl: this.cacheTTL });
      this.logger.debug(`Post ${postId} encontrado com sucesso`);
      return post;
    } catch (error) {
      this.logger.error(`Erro ao buscar post: ${error.message}`);
      throw new NotFoundException('Post não encontrado');
    }
  }

  /**
   * Atualiza um post existente.
   *
   * @param categoryIdSubcategoryId Chave de partição formada por "categoryId#subcategoryId".
   * @param postId Chave de classificação do post.
   * @param updatePostDto Dados para atualização do post.
   * @returns O post atualizado como PostDetailDto.
   * @throws BadRequestException Caso ocorra alguma falha na atualização.
   */
  async updatePost(
    categoryIdSubcategoryId: string,
    postId: string,
    updatePostDto: UpdatePostDto
  ): Promise<PostDetailDto> {
    this.logger.debug(`Iniciando atualização do post ${postId}`);
    try {
      const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto);
      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
        ...updateExpression,
        ReturnValues: 'ALL_NEW',
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
   * Deleta um post do DynamoDB.
   *
   * @param categoryIdSubcategoryId Chave de partição formada por "categoryId#subcategoryId".
   * @param postId Chave de classificação do post.
   * @returns void.
   * @throws BadRequestException Caso ocorra alguma falha na deleção.
   */
  async deletePost(
    categoryIdSubcategoryId: string,
    postId: string
  ): Promise<void> {
    this.logger.debug(`Iniciando deleção do post ${postId}`);
    try {
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
      };

      await this.dynamoDbService.deleteItem(params);
      await this.invalidateCache(categoryIdSubcategoryId, postId);
      this.logger.debug(`Post ${postId} deletado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao deletar post: ${error.message}`);
      throw new BadRequestException('Falha ao deletar post');
    }
  }


  /**
   * Invalida o cache relacionado a um post específico.
   *
   * @param categoryIdSubcategoryId Chave de partição formada por "categoryId#subcategoryId".
   * @param postId Chave de classificação do post.
   */
  private async invalidateCache(
    categoryIdSubcategoryId: string,
    postId: string
  ) {
    try {
      const keys = [
        `post_${categoryIdSubcategoryId}_${postId}`,
        `posts_${categoryIdSubcategoryId}`,
        'posts_all',
      ];
      await Promise.all(keys.map((key) => this.cacheManager.del(key)));
    } catch (error) {
      this.logger.error(`Erro ao invalidar cache: ${error.message}`);
    }
  }

  /**
   * Mapeia um item do DynamoDB para um DTO de post resumido.
   *
   * @param item Item retornado do DynamoDB.
   * @returns Um PostDetailDto com os dados essenciais do post.
   */
  private mapDynamoItemToPostDto(item: any): PostDetailDto {
    return {
      title: item.title,
      featuredImageURL: item.featuredImageURL,
      description: item.description,
    };
  }

  /**
   * Mapeia um item do DynamoDB para um DTO de post detalhado.
   *
   * @param item Item retornado do DynamoDB.
   * @returns Um PostDetailDto com todos os dados do post.
   */
  private mapDynamoItemToPostDetailDto(item: any): PostDetailDto {
    return {
      title: item.title.S,
      featuredImageURL: item.featuredImageURL?.S,
      description: item.description.S,
      contentHTML: item.contentHTML.S,
      authorId: item.authorId.S,
      canonical: item.canonical?.S,
      keywords: item.keywords?.SS || [],
      readingTime: item.readingTime?.N ? parseInt(item.readingTime.N) : 0,
      views: item.views?.N ? parseInt(item.views.N) : 0,
      slug: item.slug.S,
      status: item.status.S,
      modifiedDate: item.modifiedDate.S,
      tags: item.tags?.SS || [],
      publishDate: item.publishDate.S
    };
  }

  /**
   * Busca um post completo pelo seu ID.
   *
   * @param categoryIdSubcategoryId Chave de partição formada por "categoryId#subcategoryId".
   * @param postId Chave de classificação do post.
   * @returns O post completo encontrado como PostDetailDto.
   * @throws NotFoundException Caso o post não seja encontrado.
   */
  async getFullPostById(
    categoryIdSubcategoryId: string,
    postId: string
  ): Promise<PostDetailDto> {
    this.logger.debug(`Iniciando busca completa do post ${postId}`);
    try {
      const cacheKey = `post_detail_${categoryIdSubcategoryId}_${postId}`;
      const cached = await this.cacheManager.get<PostDetailDto>(cacheKey);
      if (cached) return cached;

      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId,
          postId,
        },
      };

      const result = await this.dynamoDbService.getItem(params);
      if (!result.Item) {
        throw new NotFoundException('Post não encontrado');
      }

      // Mapeia o item retornado para o DTO PostDetailDto com todos os campos definidos
      const postDetailDto: PostDetailDto = {
        title: result.Item.title,
        featuredImageURL: result.Item.featuredImageURL,
        description: result.Item.description,
        contentHTML: result.Item.contentHTML,
        authorId: result.Item.authorId,
        canonical: result.Item.canonical,
        keywords: result.Item.keywords,
        readingTime: result.Item.readingTime ? Number(result.Item.readingTime) : 0,
        views: result.Item.views ? Number(result.Item.views) : 0,
        slug: result.Item.slug,
        status: result.Item.status,
        modifiedDate: result.Item.modifiedDate,
      };

      await this.cacheManager.set(cacheKey, postDetailDto, { ttl: this.cacheTTL });
      this.logger.debug(`Post completo ${postId} encontrado com sucesso`);
      return postDetailDto;
    } catch (error) {
      this.logger.error(`Erro ao buscar post completo: ${error.message}`);
      throw new NotFoundException('Post não encontrado');
    }
  }



}

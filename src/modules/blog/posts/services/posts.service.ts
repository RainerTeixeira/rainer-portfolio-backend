// src/modules/blog/posts/services/posts.service.ts

import { ConfigService } from '@nestjs/config';
import {
  Injectable, Logger, BadRequestException, NotFoundException,
  Inject, InternalServerErrorException // Usar InternalServerErrorException para erros inesperados
} from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'; // Para Cache
import { QueryCommandInput, AttributeValue, ScanCommandInput, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
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

/**
 * @interface PaginatedPostsResult
 * @description Define a estrutura de retorno para posts paginados.
 */
interface PaginatedPostsResult {
  /** Lista de resumos de posts da página atual. */
  items: PostSummaryDto[];
  /** Chave para buscar a próxima página (null se não houver mais páginas). */
  nextKey: string | null;
}

/**
 * @interface SimpleSuccessMessage
 * @description Estrutura simples para mensagens de sucesso (ex: exclusão).
 */
interface SimpleSuccessMessage {
  message: string;
}


/**
 * @service PostsService
 * @description Responsável pela lógica de negócio e acesso a dados dos posts do blog.
 * Interage com DynamoDB, gerencia cache e coordena com outros serviços (Authors, Categories, etc.).
 *
 * @strategies
 * - **Performance:** Cache (leitura), Projeções (DynamoDB), Paginação por Cursor, Consultas Paralelas (enriquecimento).
 * - **Consistência:** Invalidação de cache em operações de escrita (CUD).
 * - **Clareza:** Retorna DTOs de negócio ou dados brutos, deixando a formatação final da API para o interceptor.
 */
@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly tableName: string;
  // Tempo de vida do cache em segundos (ex: 5 minutos)
  private readonly CACHE_TTL_POST = 300;
  // Prefixo para chaves de cache de posts
  private readonly CACHE_KEY_PREFIX_POST = 'post:';
  // Chave para listas paginadas (pode precisar de mais granularidade)
  private readonly CACHE_KEY_PAGINATED = 'posts:paginated';


  constructor(
    private readonly configService: ConfigService,
    private readonly dynamoDbService: DynamoDbService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // Injeção dos outros serviços necessários para enriquecimento
    private readonly authorsService: AuthorsService,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
    private readonly commentsService: CommentsService,
  ) {
    this.tableName = this.configService.get<string>('DYNAMO_TABLE_NAME_POSTS') || 'Posts';
    this.logger.log(`PostsService inicializado. Tabela DynamoDB: ${this.tableName}`);
  }

  /**
   * @method createPost
   * @description Cria um novo post no DynamoDB.
   * @param dto DTO com os dados do post a ser criado.
   * @returns O DTO `PostContentDto` do post recém-criado.
   * @throws BadRequestException Se ocorrer um erro durante a criação.
   */
  async createPost(dto: PostCreateDto): Promise<PostContentDto> {
    const postId = generatePostId();
    const now = new Date().toISOString();
    this.logger.log(`Tentando criar post com ID: ${postId}`);

    // Validações adicionais podem ser feitas aqui (ex: slug único, se necessário)

    const postItem = this.buildPostItem(postId, now, dto);

    try {
      await this.dynamoDbService.putItem({
        TableName: this.tableName,
        Item: postItem,
        // ConditionExpression: 'attribute_not_exists(postId)' // Opcional: Garante que o ID não exista
      });

      this.logger.log(`Post ${postId} criado com sucesso.`);
      // Invalida cache de listas após criação
      await this.clearPaginatedCache();

      // Retorna o DTO do post criado, mapeado do item salvo
      return this.mapToContentDto(postItem);

    } catch (error: any) {
      this.logDynamoError('createPost', error);
      // Verifica se foi erro de condição (ex: ID já existe)
      if (error.name === 'ConditionalCheckFailedException') {
        throw new BadRequestException(`Post com ID ${postId} já existe.`);
      }
      throw new InternalServerErrorException('Erro ao salvar post no banco de dados.');
    }
  }

  /**
   * @method getPaginatedPosts
   * @description Busca posts de forma paginada, otimizada para leitura.
   * Utiliza Scan com Projections e cursor (ExclusiveStartKey).
   * @param limit Quantidade de itens por página.
   * @param nextKey Cursor (string base64) para buscar a próxima página.
   * @returns Objeto `PaginatedPostsResult` contendo os itens e a chave da próxima página.
   * @throws InternalServerErrorException Em caso de erro na busca.
   */
  async getPaginatedPosts(limit: number, nextKey?: string): Promise<PaginatedPostsResult> {
    this.logger.log(`Buscando posts paginados. Limite: ${limit}, NextKey: ${nextKey ? 'presente' : 'ausente'}`);

    const cacheKey = `${this.CACHE_KEY_PAGINATED}:${limit}:${nextKey || 'first'}`;
    try {
      // 1. Tenta buscar do Cache
      const cachedResult = await this.cacheManager.get<PaginatedPostsResult>(cacheKey);
      if (cachedResult) {
        this.logger.log(`Resultado paginado encontrado no cache para key: ${cacheKey}`);
        return cachedResult;
      }

      // 2. Se não está no cache, busca no DynamoDB
      this.logger.log(`Cache miss para ${cacheKey}. Buscando no DynamoDB...`);
      const params: ScanCommandInput = {
        TableName: this.tableName,
        Limit: limit,
        // Projeta apenas os campos necessários para o PostSummaryDto
        ProjectionExpression: 'postId, title, description, publishDate, slug, featuredImageURL, #st, views', // Use alias para 'status'
        ExpressionAttributeNames: { '#st': 'status' }, // Alias para a palavra reservada 'status'
        // Adiciona a chave de início se fornecida
        ...(nextKey && { ExclusiveStartKey: this.decodeNextKey(nextKey) }),
        // Adicionar filtro? Ex: FilterExpression: "#st = :publishedStatus", ExpressionAttributeValues: {":publishedStatus": {S: "published"}}
      };

      const result = await this.dynamoDbService.scan(params);
      const posts = result.Items?.map(item => this.mapToSummaryDto(item)) || [];
      const lastEvaluatedKey = result.LastEvaluatedKey;
      const encodedNextKey = lastEvaluatedKey ? this.encodeNextKey(lastEvaluatedKey) : null;

      const paginatedResult: PaginatedPostsResult = {
        items: posts,
        nextKey: encodedNextKey,
      };

      // 3. Salva no Cache antes de retornar
      await this.cacheManager.set(cacheKey, paginatedResult, this.CACHE_TTL_POST / 2); // Cache de lista pode ter TTL menor
      this.logger.log(`Resultado paginado salvo no cache para key: ${cacheKey}`);

      return paginatedResult;

    } catch (error) = {
      // Cache pode ser apenas ignorado
    }
  }

  /**
   * @method decodeNextKey
   * @description Decodifica a chave de paginação de Base64 para objeto DynamoDB.
   * @param nextKey Chave codificada em Base64.
   * @returns Objeto `LastEvaluatedKey` do DynamoDB.
   * @throws BadRequestException Se a chave for inválida.
   */
  private decodeNextKey(nextKey: string): Record<string, AttributeValue> {
    try {
      return JSON.parse(Buffer.from(nextKey, 'base64').toString('utf8'));
    } catch (e) {
      this.logger.warn(`Falha ao decodificar nextKey: ${nextKey}`, e);
      throw new BadRequestException('Chave de paginação inválida.');
    }
  }

  /**
   * @method encodeNextKey
   * @description Codifica a `LastEvaluatedKey` do DynamoDB para string Base64.
   * @param lastKey Objeto `LastEvaluatedKey` retornado pelo DynamoDB.
   * @returns String Base64 representando a chave.
   */
  private encodeNextKey(lastKey: Record<string, AttributeValue>): string {
    return Buffer.from(JSON.stringify(lastKey)).toString('base64');
  }

  // --- Mapeadores Auxiliares ---

  /**
   * @method buildPostItem
   * @description Constrói o objeto de item do DynamoDB a partir do DTO e metadados.
   * @param postId ID gerado para o post.
   * @param isoDate String ISO da data atual.
   * @param dto DTO com dados de criação ou atualização.
   * @returns Objeto formatado para o DynamoDB.
   */
  private buildPostItem(postId: string, isoDate: string, dto: PostCreateDto | PostUpdateDto): Record<string, AttributeValue> {
    // Comum a create e update (parcialmente)
    const item: Record<string, AttributeValue> = {
      postId: { S: postId },
      modifiedDate: { S: isoDate }, // Sempre atualiza a data de modificação
      // Adiciona 'views' apenas na criação, ou se vier no DTO de update
      ...(!(dto instanceof PostUpdateDto) && { views: { N: '0' } }),
      // Adiciona 'publishDate' e 'status' inicial apenas na criação
      ...(!(dto instanceof PostUpdateDto) && {
        publishDate: { S: isoDate },
        status: { S: 'draft' },
      }),
      // Campos do DTO (presentes em ambos ou opcionais)
      ...(dto.title !== undefined && { title: { S: dto.title } }), // Permite string vazia
      ...(dto.slug && { slug: { S: dto.slug } }),
      ...(dto.contentHTML !== undefined && { contentHTML: { S: dto.contentHTML } }),
      ...(dto.featuredImageURL && { featuredImageURL: { S: dto.featuredImageURL } }),
      ...(dto.keywords && dto.keywords.length > 0 && { keywords: { SS: dto.keywords } }),
      ...(dto.readingTime !== undefined && { readingTime: { N: dto.readingTime.toString() } }),
      ...(dto.tags && dto.tags.length > 0 && { tags: { SS: dto.tags } }),
      ...(dto.categoryId && dto.subcategoryId && {
        'categoryId#subcategoryId': { S: `${dto.categoryId}#${dto.subcategoryId}` }, // Chave composta para GSI, se houver
        categoryId: { S: dto.categoryId },
        subcategoryId: { S: dto.subcategoryId },
      }),
      ...(dto.authorId && { authorId: { S: dto.authorId } }),
      ...(dto.canonical && { canonical: { S: dto.canonical } }),
      ...(dto.description !== undefined && { description: { S: dto.description } }), // Inclui description se existir no DTO
      // Status só é atualizado se vier explicitamente no DTO de Update
      ...(dto instanceof PostUpdateDto && dto.status && { status: { S: dto.status } }),
    };
    // Remove chaves com valor 'undefined' (não suportado pelo DynamoDB SDK v3 diretamente)
    Object.keys(item).forEach(key => item[key] === undefined && delete item[key]);
    return item;
  }


  /**
   * @method mapToContentDto
   * @description Mapeia um item do DynamoDB para o DTO `PostContentDto`.
   * @param item Item retornado do DynamoDB.
   * @returns Objeto `PostContentDto`.
   */
  private mapToContentDto(item: Record<string, AttributeValue>): PostContentDto {
    return {
      postId: item.postId?.S ?? '', // Use ?? para fallback
      title: item.title?.S ?? '',
      status: item.status?.S ?? 'draft',
      publishDate: item.publishDate?.S ?? '',
      modifiedDate: item.modifiedDate?.S ?? '',
      views: Number(item.views?.N ?? 0),
      slug: item.slug?.S ?? '',
      contentHTML: item.contentHTML?.S ?? '',
      description: item.description?.S ?? '', // Mapeia description
      featuredImageURL: item.featuredImageURL?.S ?? '',
      keywords: item.keywords?.SS ?? [],
      readingTime: Number(item.readingTime?.N ?? 0),
      tags: item.tags?.SS ?? [],
      categoryId: item.categoryId?.S ?? '',
      subcategoryId: item.subcategoryId?.S ?? '',
      authorId: item.authorId?.S ?? '',
      canonical: item.canonical?.S, // Pode ser undefined
    };
  }

  /**
   * @method mapToSummaryDto
   * @description Mapeia um item do DynamoDB para o DTO `PostSummaryDto`.
   * @param item Item retornado do DynamoDB (geralmente com projeção).
   * @returns Objeto `PostSummaryDto`.
   */
  private mapToSummaryDto(item: Record<string, AttributeValue>): PostSummaryDto {
    return {
      postId: item.postId?.S ?? '',
      title: item.title?.S ?? '',
      description: item.description?.S ?? '', // Usa description se projetado
      publishDate: item.publishDate?.S ?? '',
      slug: item.slug?.S ?? '',
      featuredImageURL: item.featuredImageURL?.S ?? '',
      status: item.status?.S ?? '', // Mapeia o alias 'status' corretamente
      views: Number(item.views?.N ?? 0),
    };
  }

  // --- Logging ---

  /**
   * @method logDynamoError
   * @description Padroniza o log de erros do DynamoDB.
   * @param method Nome do método onde ocorreu o erro.
   * @param error Erro capturado.
   */
  private logDynamoError(method: string, error: any): void {
    this.logger.error(
      `[${method}] Erro ao interagir com DynamoDB. Nome: ${error.name}, Mensagem: ${error.message}`,
      error.$metadata ? JSON.stringify(error.$metadata) : error.stack // Inclui metadados da requisição AWS se disponível
    );
  }
}
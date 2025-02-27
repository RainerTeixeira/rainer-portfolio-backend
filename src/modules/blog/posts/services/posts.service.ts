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
  DeleteCommandInput,
  ScanCommandInput // Import ScanCommandInput for scan operation
} from '@aws-sdk/lib-dynamodb';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service';
import { v4 as uuidv4 } from 'uuid';
import { AuthorDto } from '../authors/dto';

const DEFAULT_CACHE_TTL = 300; // 5 minutos

/**
 * Serviço responsável por gerenciar as operações relacionadas a Posts.
 * Inclui a criação, leitura, atualização e exclusão de posts, além de caching
 * para otimizar a performance e reduzir a carga no banco de dados DynamoDB.
 */
@Injectable()
export class PostsService {
  private tableName = 'Posts'; // Nome da tabela no DynamoDB onde os posts são armazenados.
  private readonly logger = new Logger(PostsService.name); // Logger para registrar eventos e erros dentro do serviço.
  private readonly cacheTTL: number; // Tempo de vida (TTL) para os itens em cache em segundos.

  constructor(
    private readonly dynamoDbService: DynamoDbService, // Serviço de acesso ao DynamoDB.
    private readonly authorsService: AuthorsService, // Serviço para gerenciar operações relacionadas a Autores.
    @Inject(CACHE_MANAGER) private cacheManager: Cache // Injeção do gerenciador de cache do NestJS.
  ) {
    // Define o TTL do cache com base na variável de ambiente ou usa um valor padrão.
    this.cacheTTL = parseInt(process.env.CACHE_TTL) || DEFAULT_CACHE_TTL;
  }

  /**
   * Cria um novo post.
   * @param categoryIdSubcategoryId - ID composto da categoria e subcategoria do post.
   * @param createPostDto - DTO contendo os dados para criar o post.
   * @returns Uma Promise que resolve para o PostDto do post criado.
   * @throws BadRequestException - Se houver falha ao criar o post.
   */
  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    this.logger.debug('Iniciando criação do post');
    try {
      const postId = uuidv4(); // Gera um UUID único para o novo post.
      const author = await this.getAuthorWithCache(createPostDto.postInfo.authorId); // Busca o autor em cache ou no serviço de autores.

      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: {
          'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de partição
          postId, // Chave primária
          entityType: 'POST', // Tipo de entidade para identificar o item como um post.
          createdAt: new Date().toISOString(), // Data de criação do post em formato ISO string.
          ...createPostDto, // Espalha as propriedades de CreatePostDto no item.
          postInfo: {
            ...createPostDto.postInfo, // Espalha as propriedades de postInfo de CreatePostDto.
            authorName: author.name, // Adiciona o nome do autor recuperado do serviço de autores.
            readingTime: Number(createPostDto.postInfo.readingTime) || 0, // Garante que readingTime seja um número.
            views: Number(createPostDto.postInfo.views) || 0 // Inicializa views como 0 ou usa o valor fornecido.
          }
        }
      };

      await this.dynamoDbService.putItem(params); // Salva o novo post no DynamoDB.
      await this.invalidateCache(categoryIdSubcategoryId, postId); // Invalida o cache para listas e detalhes de posts.
      this.logger.debug('Post criado com sucesso');
      return this.mapDynamoItemToPostDto(params.Item); // Retorna o DTO do post criado.
    } catch (error) {
      this.logger.error(`Erro ao criar post: ${error.message}`, error.stack);
      throw new BadRequestException('Falha ao criar post'); // Lança exceção em caso de falha.
    }
  }

  /**
     * Busca todos os posts com paginação, diretamente da tabela 'Posts' usando scan (SEM FILTROS).
     * @param lastKey - Chave para paginação, recebida da resposta da consulta anterior para continuar a paginação.
     * @returns Uma Promise que resolve para um objeto contendo a lista de PostDto e a lastKey para a próxima página.
     *
     * @description
     * Utiliza a operação 'scan' do DynamoDB para buscar todos os posts da tabela 'Posts'.
     * **IMPORTANTE:** Esta versão *não aplica filtros*, retornando todos os itens do tipo 'POST' na tabela.
     * A paginação é implementada usando 'ExclusiveStartKey' para eficiência em tabelas grandes.
     * **Importante:** A operação 'scan' pode ser ineficiente em tabelas muito grandes, pois lê todos os itens.
     * Em produção, para tabelas grandes, considere reativar o uso de GSI ou outras otimizações se precisar de filtros e paginação eficientes.
     */
  async getAllPosts(lastKey?: any): Promise<{ posts: PostDto[], lastKey: any | null }> {
    this.logger.debug('Iniciando busca de todos os posts (SCAN SEM FILTROS e SEM GSI)');

    try {
      // Define a chave para o cache, incluindo 'lastKey' para diferenciar páginas cacheadas.
      const cacheKey = `all_posts_scan_page_no_filter_${lastKey ? JSON.stringify(lastKey) : 'first'}`; // Chave de cache ajustada
      this.logger.debug(`Cache key gerado: ${cacheKey}`);

      // Tenta obter os dados do cache.
      const cached = await this.cacheManager.get<{ posts: PostDto[], lastKey: any | null }>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit para ${cacheKey}`);
        this.logger.debug(`Retornando dados do cache: ${JSON.stringify(cached)}`);
        return cached; // Retorna dados cacheados se disponíveis.
      } else {
        this.logger.debug(`Cache miss para ${cacheKey}`);
      }


      // Parâmetros para a operação de scan no DynamoDB - **SEM FILTROS AGORA!**
      const queryParams: ScanCommandInput = { // Usando ScanCommandInput
        TableName: "Posts", // Consultando diretamente a tabela 'Posts'
        // **REMOVIDO FilterExpression, ExpressionAttributeNames e ExpressionAttributeValues**
        Limit: 20 // Limita o número de posts retornados por página (para paginação).
      };

      // Se 'lastKey' for fornecido, adiciona 'ExclusiveStartKey' para paginação.
      if (lastKey) {
        queryParams.ExclusiveStartKey = lastKey;
        this.logger.debug(`Paginação ativada, lastKey: ${JSON.stringify(lastKey)}`);
      }

      this.logger.debug('Consultando o DynamoDB com os seguintes parâmetros (SCAN SEM FILTROS):');
      this.logger.debug(JSON.stringify(queryParams, null, 2));

      const result = await this.dynamoDbService.scan(queryParams); // Executa a operação de scan.
      this.logger.debug('Resultado da consulta DynamoDB (SCAN SEM FILTROS):', JSON.stringify(result, null, 2));

      const newLastKey = result.LastEvaluatedKey || null; // Obtém a 'LastEvaluatedKey' para paginação futura.
      this.logger.debug(`Nova última chave (lastKey): ${JSON.stringify(newLastKey)}`);

      // Mapeia os itens do DynamoDB para PostDto.
      const posts: PostDto[] = result.Items ? result.Items.map(item => this.mapDynamoItemToPostDto(item)) : [];
      this.logger.debug(`Quantidade de posts retornados: ${posts.length}`);

      // Salva os dados no cache.
      await this.cacheManager.set(cacheKey, { posts, lastKey: newLastKey }, { ttl: 60 * 5 });
      this.logger.debug(`Dados cacheados com sucesso para ${cacheKey}`);

      this.logger.debug('Posts obtidos com sucesso (SCAN SEM FILTROS)');
      return { posts, lastKey: newLastKey }; // Retorna posts e a nova 'lastKey'.

    } catch (error) {
      this.logger.error('Erro ao obter as postagens (SCAN SEM FILTROS)', error);
      throw new Error('Erro ao obter as postagens (SCAN SEM FILTROS)'); // Lança erro genérico em caso de falha.
    }
  }

  private mapToFullPostDto(item: any): FullPostDto {
    const postDto = this.mapDynamoItemToPostDto(item);

    // Adicione aqui a lógica para buscar autor e comentários se necessário
    return {
      ...postDto,
      author: undefined, // Implemente a busca do autor
      comments: undefined // Implemente a busca de comentários
    };
  }




  /**
   * Busca um post pelo ID composto (categoryId#subcategoryId e postId).
   * @param categoryIdSubcategoryId - ID composto da categoria e subcategoria do post.
   * @param postId - ID do post a ser buscado.
   * @returns Uma Promise que resolve para o PostDto do post encontrado.
   * @throws NotFoundException - Se o post não for encontrado.
   */
  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    this.logger.debug(`Iniciando busca do post ${postId}`);
    try {
      const cacheKey = `post_${categoryIdSubcategoryId}_${postId}`; // Define a chave para o cache individual do post.
      const cached = await this.cacheManager.get<PostDto>(cacheKey); // Tenta obter o post do cache.

      if (cached) return cached; // Retorna o post do cache se encontrado.

      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de partição para buscar o post.
          postId // Chave primária para buscar o post.
        }
      };

      const result = await this.dynamoDbService.getItem(params); // Busca o post no DynamoDB.
      if (!result.Item) throw new NotFoundException('Post não encontrado'); // Lança exceção se o post não existir.

      const post = this.mapDynamoItemToPostDto(result.Item); // Mapeia o item do DynamoDB para PostDto.
      await this.cacheManager.set(cacheKey, post, this.cacheTTL); // Salva o post no cache.
      this.logger.debug(`Post ${postId} encontrado com sucesso`);
      return post; // Retorna o PostDto do post encontrado.
    } catch (error) {
      this.logger.error(`Erro ao buscar post: ${error.message}`);
      throw new NotFoundException('Post não encontrado'); // Lança exceção de not found em caso de erro ou post não encontrado.
    }
  }

  /**
   * Atualiza um post existente.
   * @param categoryIdSubcategoryId - ID composto da categoria e subcategoria do post.
   * @param postId - ID do post a ser atualizado.
   * @param updatePostDto - DTO contendo os dados para atualizar o post.
   * @returns Uma Promise que resolve para o PostDto do post atualizado.
   * @throws BadRequestException - Se houver falha ao atualizar o post.
   */
  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    this.logger.debug(`Iniciando atualização do post ${postId}`);
    try {
      const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto); // Constrói a expressão de atualização.

      const params: UpdateCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de partição para atualizar o post.
          postId // Chave primária para atualizar o post.
        },
        ...updateExpression, // Aplica a expressão de atualização construída.
        ReturnValues: 'ALL_NEW' // Retorna todos os atributos do item APÓS a atualização.
      };

      const result = await this.dynamoDbService.updateItem(params); // Atualiza o item no DynamoDB.
      await this.invalidateCache(categoryIdSubcategoryId, postId); // Invalida o cache do post e listas relacionadas.
      this.logger.debug(`Post ${postId} atualizado com sucesso`);
      return this.mapDynamoItemToPostDto(result.Attributes); // Retorna o DTO do post atualizado.
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${error.message}`);
      throw new BadRequestException('Falha ao atualizar post'); // Lança exceção em caso de falha.
    }
  }

  /**
   * Deleta um post.
   * @param categoryIdSubcategoryId - ID composto da categoria e subcategoria do post.
   * @param postId - ID do post a ser deletado.
   * @returns Uma Promise que resolve void quando o post é deletado com sucesso.
   * @throws BadRequestException - Se houver falha ao deletar o post.
   */
  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    this.logger.debug(`Iniciando deleção do post ${postId}`);
    try {
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: {
          'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de partição para deletar o post.
          postId // Chave primária para deletar o post.
        }
      };

      await this.dynamoDbService.deleteItem(params); // Deleta o item do DynamoDB.
      await this.invalidateCache(categoryIdSubcategoryId, postId); // Invalida o cache do post e listas.
      this.logger.debug(`Post ${postId} deletado com sucesso`);
    } catch (error) {
      this.logger.error(`Erro ao deletar post: ${error.message}`);
      throw new BadRequestException('Falha ao deletar post'); // Lança exceção em caso de falha.
    }
  }

  /**
   * Busca informações de um autor, utilizando cache para otimizar a busca.
   * @param authorId - ID do autor a ser buscado.
   * @returns Uma Promise que resolve para o AuthorDto do autor encontrado.
   * @throws NotFoundException - Se o autor não for encontrado.
   * @private
   */
  private async getAuthorWithCache(authorId: string) {
    try {
      const cacheKey = `author_${authorId}`; // Define a chave para o cache do autor.
      const cached = await this.cacheManager.get<AuthorDto>(cacheKey); // Tenta obter o autor do cache.
      if (cached) return cached; // Retorna o autor do cache se encontrado.

      const author = await this.authorsService.getAuthorById(authorId); // Busca o autor usando o serviço de autores.
      await this.cacheManager.set(cacheKey, author, this.cacheTTL); // Salva o autor no cache.
      return author; // Retorna o AuthorDto do autor encontrado.
    } catch (error) {
      this.logger.error(`Autor não encontrado: ${authorId}`);
      throw new NotFoundException('Autor não encontrado'); // Lança exceção de not found se o autor não for encontrado.
    }
  }

  /**
   * Invalida as entradas de cache relacionadas a um post.
   * @param categoryIdSubcategoryId - ID composto da categoria e subcategoria do post.
   * @param postId - ID do post para invalidar o cache.
   * @private
   */
  private async invalidateCache(categoryIdSubcategoryId: string, postId: string) {
    try {
      // Define as chaves de cache a serem invalidadas: detalhes do post, lista de posts da categoria e lista de todos os posts.
      const keys = [
        `post_${categoryIdSubcategoryId}_${postId}`, // Cache individual do post.
        `posts_${categoryIdSubcategoryId}`, // Cache da lista de posts por categoria/subcategoria.
        'posts_all' // Cache da lista de todos os posts (se houver).
      ];
      // Deleta cada chave de cache em paralelo.
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
    } catch (error) {
      this.logger.error(`Erro ao invalidar cache: ${error.message}`);
    }
  }

  /**
   * Mapeia um item retornado do DynamoDB para um PostDto.
   * @param item - Item retornado do DynamoDB.
   * @returns PostDto - O item mapeado para o formato PostDto.
   * @private
   */
  private mapDynamoItemToPostDto(item: any): PostDto {
    return {
      'categoryId#subcategoryId': item['categoryId#subcategoryId'], // Mapeia a chave de categoria e subcategoria.
      postId: item.postId, // Mapeia o ID do post.
      categoryId: item.categoryId, // Mapeia o ID da categoria.
      subcategoryId: item.subcategoryId, // Mapeia o ID da subcategoria.
      contentHTML: item.contentHTML, // Mapeia o conteúdo HTML do post.
      postInfo: item.postInfo && { // Mapeia as informações do post, garantindo que postInfo exista.
        ...item.postInfo, // Espalha outras propriedades de postInfo.
        readingTime: Number(item.postInfo?.readingTime) || 0, // Mapeia e garante que readingTime seja um número.
        views: Number(item.postInfo?.views) || 0 // Mapeia e garante que views seja um número.
      },
      seo: item.seo // Mapeia as informações de SEO do post.
    };
  }

  /**
   * Busca um post pelo ID e retorna um FullPostDto, incluindo metadados adicionais.
   * @param categoryIdSubcategoryId - ID composto da categoria e subcategoria do post.
   * @param postId - ID do post.
   * @returns Uma Promise que resolve para o FullPostDto do post encontrado.
   */
  async getFullPostById(categoryIdSubcategoryId: string, postId: string): Promise<FullPostDto> {
    this.logger.debug(`Iniciando busca completa do post ${postId}`);
    const post = await this.getPostById(categoryIdSubcategoryId, postId); // Busca o PostDto básico.
    this.logger.debug(`Post completo ${postId} encontrado com sucesso`);
    return {
      ...post, // Espalha as propriedades do PostDto.
      metadata: { // Adiciona metadados ao FullPostDto.
        fetchedAt: new Date().toISOString(), // Data e hora em que o post foi buscado.
        source: 'cache/database' // Indica a origem dos dados (cache ou banco de dados).
      }
    };
  }
}
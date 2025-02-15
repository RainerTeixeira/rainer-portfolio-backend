import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa o DynamoDbService para interagir com o DynamoDB
import { CreatePostDto } from '../dto/create-post.dto'; // Importa o DTO para criar posts
import { UpdatePostDto } from '../dto/update-post.dto'; // Importa o DTO para atualizar posts
import { PostDto } from '../dto/post.dto'; // Importa o DTO de Post (estrutura básica)
import { v4 as uuidv4 } from 'uuid'; // Importa a função uuidv4 para gerar IDs únicos para posts
import { AuthorsService } from '../../authors/services/authors.service'; // Importa o AuthorsService para buscar informações do autor
import { CommentsService } from '../../comments/services/comments.service'; // Importa o CommentsService para buscar comentários do post
import { FullPostDto } from '../dto/full-post.dto'; // Importa o DTO de FullPost (post completo com autor e comentários)

/**
 * @Injectable PostsService
 * @description Serviço responsável pela lógica de negócio dos Posts.
 *
 * Este serviço contém os métodos para realizar operações CRUD (Create, Read, Update, Delete)
 * na tabela de Posts do DynamoDB, além de métodos específicos para buscar todos os posts do blog
 * e um post específico com informações completas (autor e comentários).
 */
@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name); // Logger para PostsService
  private readonly tableName = 'Posts'; // Nome da tabela Posts no DynamoDB

  /**
   * @constructor
   * @param {DynamoDbService} dynamoDbService - Serviço injetado para acesso ao DynamoDB.
   * @param {AuthorsService} authorsService - Serviço injetado para acesso aos Autores.
   * @param {CommentsService} commentsService - Serviço injetado para acesso aos Comentários.
   * @description Injeta as dependências necessárias: DynamoDbService, AuthorsService e CommentsService.
   */
  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private readonly authorsService: AuthorsService,
    private readonly commentsService: CommentsService,
  ) { }

  /**
   * @method createPost
   * @async
   * @description Cria um novo post no DynamoDB.
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria ('categoriaId#subcategoriaId').
   * @param {CreatePostDto} createPostDto - DTO contendo os dados para criação do post.
   * @returns {Promise<PostDto>} - Retorna uma Promise que resolve para o PostDto do post criado.
   * @throws {Error} - Lança um erro se a operação de criação falhar.
   */
  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    const postId = uuidv4(); // Gera um UUID único para o postId
    const params = {
      TableName: this.tableName,
      Item: {
        ...createPostDto, // Espalha as propriedades de createPostDto
        postId, // Adiciona o postId gerado
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Adiciona a chave de partição categoryIdSubcategoryId
      },
    };
    try {
      await this.dynamoDbService.putItem(params); // Salva o item no DynamoDB
      return this.getPostById(categoryIdSubcategoryId, postId); // Busca e retorna o post recém-criado
    } catch (error) {
      this.logger.error(`Erro ao criar post na categoria/subcategoria ${categoryIdSubcategoryId}:`, error);
      throw error; // Re-lança o erro para ser tratado no Controller
    }
  }

  /**
   * @method getAllBlogPosts
   * @async
   * @description Busca todos os posts do blog, incluindo informações do autor e comentários.
   * @returns {Promise<FullPostDto[]>} - Retorna uma Promise que resolve para um array de FullPostDto,
   *                                     contendo todos os posts do blog com autor e comentários.
   * @throws {Error} - Lança um erro se a operação de busca falhar.
   */
  async getAllBlogPosts(): Promise<FullPostDto[]> {
    const params: any = { // Define o objeto de parâmetros para a operação de scan
      TableName: this.tableName, // Especifica a tabela Posts
    };

    try {
      const result = await this.dynamoDbService.scan(params); // Escaneia a tabela Posts
      // Mapeia os itens retornados do DynamoDB para FullPostDto, buscando autor e comentários para cada post
      const fullPostsPromises = (result.Items || []).map(async (item) => {
        const postDto = this.mapDynamoItemToPostDto(item); // Mapeia o item para PostDto base
        const fullPostDto = new FullPostDto(); // Cria um novo FullPostDto
        Object.assign(fullPostDto, postDto); // Copia as propriedades de PostDto para FullPostDto

        // Busca informações do autor, se authorId existir
        if (fullPostDto.postInfo && fullPostDto.postInfo.authorId) {
          try {
            fullPostDto.author = await this.authorsService.getAuthorById(fullPostDto.postInfo.authorId); // Busca autor pelo authorId
          } catch (authorError) {
            this.logger.error(`Erro ao buscar autor do post ${postDto.postId}:`, authorError);
            fullPostDto.author = null; // Define autor como null em caso de erro
          }
        }

        // Busca comentários do post
        try {
          fullPostDto.comments = await this.commentsService.getCommentsByPostId(postDto.postId); // Busca comentários pelo postId
        } catch (commentsError) {
          this.logger.error(`Erro ao buscar comentários do post ${postDto.postId}:`, commentsError);
          fullPostDto.comments = []; // Define comments como array vazio em caso de erro
        }
        return fullPostDto; // Retorna o FullPostDto preenchido
      });

      return Promise.all(fullPostsPromises); // Aguarda todas as promises de busca de autor e comentários
    } catch (error) {
      this.logger.error('Erro ao buscar todos os posts do blog:', error);
      throw error; // Re-lança o erro para ser tratado no Controller
    }
  }


  /**
   * @method getAllPosts
   * @async
   * @description Busca todos os posts dentro de uma categoria/subcategoria específica ou todos se categoryIdSubcategoryId não for fornecido.
   * @param {string} [categoryIdSubcategoryId] - Chave composta da categoria e subcategoria para filtrar os posts (opcional).
   * @returns {Promise<PostDto[]>} - Retorna uma Promise que resolve para um array de PostDto,
   *                                   contendo os posts filtrados por categoria/subcategoria (ou todos se não houver filtro).
   * @throws {Error} - Lança um erro se a operação de busca falhar.
   */
  async getAllPosts(categoryIdSubcategoryId?: string): Promise<PostDto[]> {
    const params: any = { // Define o objeto de parâmetros para a operação de scan
      TableName: this.tableName, // Especifica a tabela Posts
    };
    if (categoryIdSubcategoryId) { // Se categoryIdSubcategoryId for fornecido, adiciona filtro
      params.FilterExpression = 'begins_with(#categoryIdSubcategoryId, :categorySubKey)'; // Filtra por chave de partição
      params.ExpressionAttributeNames = { '#categoryIdSubcategoryId': 'categoryId#subcategoryId' }; // Mapeia nome do atributo para evitar conflitos
      params.ExpressionAttributeValues = { ':categorySubKey': categoryIdSubcategoryId }; // Define valor do filtro
    }

    try {
      const result = await this.dynamoDbService.scan(params); // Escaneia a tabela Posts (com filtro, se aplicável)
      return (result.Items || []).map(item => this.mapDynamoItemToPostDto(item)); // Mapeia os itens para PostDto
    } catch (error) {
      this.logger.error(`Erro ao buscar posts da categoria/subcategoria ${categoryIdSubcategoryId || 'geral'}:`, error);
      throw error; // Re-lança o erro para ser tratado no Controller
    }
  }


  /**
   * @method getPostById
   * @async
   * @description Busca um post específico no DynamoDB usando categoryIdSubcategoryId e postId.
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria do post.
   * @param {string} postId - ID do post a ser buscado.
   * @returns {Promise<PostDto>} - Retorna uma Promise que resolve para o PostDto encontrado.
   * @throws {NotFoundException} - Lança NotFoundException se o post não for encontrado.
   * @throws {Error} - Lança um erro se a operação de busca falhar.
   */
  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    this.logger.log(`getPostById: Iniciando busca do post com ID ${postId} e categoryIdSubcategoryId ${categoryIdSubcategoryId}...`);
    const params = {
      TableName: this.tableName,
      Key: { // Define a chave primária para busca (chave de partição e chave de classificação)
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };
    this.logger.log(`getPostById: Parametros para DynamoDB: ${JSON.stringify(params)}`);

    try {
      const result = await this.dynamoDbService.getItem(params); // Busca o item no DynamoDB
      this.logger.log(`getPostById: Resultado bruto do DynamoDB: ${JSON.stringify(result)}`);
      const item = result.Item; // Extrai o item do resultado

      if (!item) {
        this.logger.log(`getPostById: Item não encontrado para postId ${postId} e categoryIdSubcategoryId ${categoryIdSubcategoryId}`);
        throw new NotFoundException(`Post com ID '${postId}' não encontrado na categoria/subcategoria '${categoryIdSubcategoryId}'`);
      }
      this.logger.log(`getPostById: Item do DynamoDB (result.Item): ${JSON.stringify(item)}`);

      const postDto = this.mapDynamoItemToPostDto(item); // Mapeia o item do DynamoDB para PostDto
      this.logger.log(`getPostById: PostDto mapeado: ${JSON.stringify(postDto)}`);

      return postDto; // Retorna o PostDto encontrado
    } catch (error) {
      this.logger.error(`Erro ao buscar post ${postId}:`, error); // Loga o erro
      throw error; // Re-lança o erro para ser tratado no Controller
    }
  }

  /**
   * @method getFullPostById
   * @async
   * @description Busca um post específico e enriquece com informações do autor e comentários.
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria do post.
   * @param {string} postId - ID do post a ser buscado.
   * @returns {Promise<FullPostDto>} - Retorna uma Promise que resolve para o FullPostDto,
   *                                     contendo o post completo com autor e comentários.
   * @throws {Error} - Lança um erro se a operação de busca falhar.
   */
  async getFullPostById(categoryIdSubcategoryId: string, postId: string): Promise<FullPostDto> {
    const postDto = await this.getPostById(categoryIdSubcategoryId, postId); // Busca o PostDto base
    const fullPostDto = new FullPostDto(); // Cria um novo FullPostDto
    Object.assign(fullPostDto, postDto); // Copia as propriedades do PostDto para o FullPostDto

    // Busca informações do autor
    if (fullPostDto.postInfo && fullPostDto.postInfo.authorId) {
      try {
        fullPostDto.author = await this.authorsService.getAuthorById(fullPostDto.postInfo.authorId); // Busca autor pelo authorId usando AuthorsService
      } catch (authorError) {
        this.logger.error(`Erro ao buscar autor do post ${postId}:`, authorError);
        fullPostDto.author = null; // Define autor como null em caso de erro
      }
    }

    // Busca comentários do post
    try {
      fullPostDto.comments = await this.commentsService.getCommentsByPostId(postId); // Busca comentários pelo postId usando CommentsService
    } catch (commentsError) {
      this.logger.error(`Erro ao buscar comentários do post ${postId}:`, commentsError);
      fullPostDto.comments = []; // Define comentários como array vazio em caso de erro
    }

    return fullPostDto; // Retorna o FullPostDto completo
  }


  /**
   * @method updatePost
   * @async
   * @description Atualiza um post existente no DynamoDB.
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria do post.
   * @param {string} postId - ID do post a ser atualizado.
   * @param {UpdatePostDto} updatePostDto - DTO contendo os dados para atualizar o post.
   * @returns {Promise<PostDto>} - Retorna uma Promise que resolve para o PostDto atualizado.
   * @throws {NotFoundException} - Lança NotFoundException se o post não for encontrado.
   * @throws {Error} - Lança um erro se a operação de atualização falhar.
   */
  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    await this.getPostById(categoryIdSubcategoryId, postId); // Verifica se o post existe antes de atualizar
    const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto); // Constrói a expressão de atualização com base no DTO
    if (!updateExpression) {
      return this.getPostById(categoryIdSubcategoryId, postId); // Se não houver campos para atualizar, retorna o post existente
    }

    const params: any = { // Define o objeto de parâmetros para a operação de update
      TableName: this.tableName,
      Key: { // Define a chave primária do item a ser atualizado
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
      ...updateExpression, // Aplica a expressão de atualização construída
      ReturnValues: 'ALL_NEW', // Retorna todos os atributos do item APÓS a atualização
    };

    try {
      const result = await this.dynamoDbService.updateItem(params); // Atualiza o item no DynamoDB
      return this.mapDynamoItemToPostDto(result.Attributes as Record<string, any>) as PostDto; // Mapeia e retorna o PostDto atualizado
    } catch (error) {
      this.logger.error(`Erro ao atualizar post ${postId}:`, error);
      throw error; // Re-lança o erro para ser tratado no Controller
    }
  }

  /**
   * @method deletePost
   * @async
   * @description Remove um post do DynamoDB.
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria do post.
   * @param {string} postId - ID do post a ser removido.
   * @returns {Promise<void>} - Retorna uma Promise que resolve para void (operação de deleção).
   * @throws {NotFoundException} - Lança NotFoundException se o post não for encontrado.
   * @throws {Error} - Lança um erro se a operação de deleção falhar.
   */
  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    await this.getPostById(categoryIdSubcategoryId, postId); // Verifica se o post existe antes de deletar
    const params = {
      TableName: this.tableName,
      Key: { // Define a chave primária do item a ser deletado
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };
    try {
      await this.dynamoDbService.deleteItem(params); // Deleta o item do DynamoDB
    } catch (error) {
      this.logger.error(`Erro ao deletar post ${postId}:`, error);
      throw error; // Re-lança o erro para ser tratado no Controller
    }
  }

  /**
   * @private
   * @method mapDynamoItemToPostDto
   * @description Mapeia um item retornado do DynamoDB para um PostDto.
   *
   * Converte a estrutura de dados do DynamoDB para o formato PostDto,
   * garantindo a tipagem e facilitando o uso dos dados na aplicação.
   *
   * @param {Record<string, any>} item - Item retornado do DynamoDB.
   * @returns {PostDto} - Retorna o PostDto mapeado.
   */
  private mapDynamoItemToPostDto(item: Record<string, any>): PostDto {
    return {
      categoryIdSubcategoryId: item['categoryId#subcategoryId']?.S, // Extrai e atribui categoryIdSubcategoryId
      postId: item.postId?.S, // Extrai e atribui postId
      categoryId: item.categoryId?.S, // Extrai e atribui categoryId
      subcategoryId: item.subcategoryId?.S, // Extrai e atribui subcategoryId
      postInfo: { // Mapeia os atributos aninhados em postInfo
        title: item.postInfo?.M?.title?.S,
        slug: item.postInfo?.M?.slug?.S,
        excerpt: item.postInfo?.M?.excerpt?.S,
        contentHTML: item.postInfo?.M?.contentHTML?.S,
        authorId: item.postInfo?.M?.authorId?.S,
        publishDate: item.postInfo?.M?.publishDate?.S,
        modifiedDate: item.postInfo?.M?.modifiedDate?.S,
        featuredImageURL: item.postInfo?.M?.featuredImageURL?.S,
        status: item.postInfo?.M?.status?.S,
        tags: item.postInfo?.M?.tags?.SS,
        views: item.postInfo?.M?.views?.N ? Number(item.postInfo.M.views.N) : 0, // Converte views para Number
        readingTime: item.postInfo?.M?.readingTime?.N ? Number(item.postInfo.M.readingTime.N) : 0, // Converte readingTime para Number
      },
      seo: { // Mapeia os atributos aninhados em seo
        canonical: item.seo?.M?.canonical?.S,
        description: item.seo?.M?.description?.S,
        keywords: item.seo?.M?.keywords?.SS,
      }
    } as PostDto; // Retorna o objeto como PostDto
  }
}
// src/modules/blog/posts/services/posts.service.ts

import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common'; // Importa os decorators e classes do NestJS, incluindo Logger para logar informações
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';
import { AuthorDto } from '@src/modules/blog/authors/dto/author.dto'; // Importa AuthorDto (correção: anteriormente importava PostDto por engano)
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Serviço de acesso ao DynamoDB
import { v4 as uuidv4 } from 'uuid'; // Biblioteca para gerar IDs únicos
import { GetCommandInput, ScanCommandInput, PutCommandInput, UpdateCommandInput, DeleteCommandInput } from '@aws-sdk/lib-dynamodb'; // Tipos de comandos do AWS SDK para DynamoDB
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service'; // Serviço para manipulação de autores (verifique o caminho)

@Injectable()
export class PostsService {
  // Nome da tabela no DynamoDB
  private tableName = 'Posts';
  // Instância do Logger para registrar logs específicos desta classe
  private readonly logger = new Logger(PostsService.name);

  // Injeta os serviços necessários via construtor
  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private readonly authorsService: AuthorsService // Serviço para buscar dados dos autores
  ) { }

  /**
   * Cria um novo post.
   * Gera um ID único para o post, monta os parâmetros para inserção no DynamoDB e retorna o post criado.
   * @param categoryIdSubcategoryId - Combinação de categoryId e subcategoryId (chave composta)
   * @param createPostDto - Dados do post a ser criado
   * @returns PostDto - O post criado, conforme mapeado do item do DynamoDB
   */
  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    // Gera um ID único para o post
    const postId = uuidv4();

    // Monta os parâmetros para o comando PutItem do DynamoDB
    const params: PutCommandInput = {
      TableName: this.tableName,
      Item: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
        categoryId: createPostDto.categoryId,
        subcategoryId: createPostDto.subcategoryId,
        contentHTML: createPostDto.contentHTML,
        postInfo: createPostDto.postInfo,
        seo: createPostDto.seo,
      },
    };

    // Insere o novo post no DynamoDB
    await this.dynamoDbService.putItem(params);
    // Retorna o post criado consultando-o pelo ID
    return this.getPostById(categoryIdSubcategoryId, postId);
  }

  /**
   * Recupera todos os posts.
   * Faz um scan na tabela 'Posts' e mapeia cada item para o DTO correspondente.
   * @returns Array<PostDto> - Lista de posts encontrados
   */
  async getAllPosts(): Promise<PostDto[]> {
    // Configura os parâmetros para escanear a tabela
    const params: ScanCommandInput = {
      TableName: this.tableName,
    };

    // Executa o scan e obtém os resultados
    const result = await this.dynamoDbService.scan(params);
    const items = result.Items;

    // Se nenhum item for encontrado, retorna um array vazio
    if (!items || items.length === 0) {
      return [];
    }

    // Mapeia os itens do DynamoDB para o DTO do post e retorna a lista
    return items.map(item => this.mapDynamoItemToPostDto(item)) as PostDto[];
  }

  /**
   * Recupera um post pelo ID.
   * Loga os passos do processo, consulta o DynamoDB e, se necessário, busca informações do autor.
   * @param categoryIdSubcategoryId - Chave composta (categoryId#subcategoryId)
   * @param postId - ID do post
   * @returns PostDto - O post encontrado, mapeado para o DTO
   * @throws NotFoundException - Se o post não for encontrado no DynamoDB
   */
  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    // ... (logs e busca do post no DynamoDB - tudo OK) ...

    // Mapeia o item para o DTO do post
    const postDto = this.mapDynamoItemToPostDto(item);
    // LOG 6: Registra o DTO mapeado
    this.logger.log(`getPostById: PostDto mapeado: ${JSON.stringify(postDto)}`);

    // Se o post possui informações de autor, tenta buscar o nome do autor
    if (postDto.postInfo && postDto.postInfo.authorId) {
      try {
        const authorDto = await this.authorsService.getAuthorById(postDto.postInfo.authorId);
        // Adiciona o nome do autor no DTO do post
        postDto.postInfo.authorName = authorDto.name;
        this.logger.log(`getPostById: Nome do autor '${authorDto.name}' adicionado ao PostDto.`);
      } catch (error) {
        // Se o autor não for encontrado, registra um aviso e continua sem o nome do autor
        this.logger.warn(`getPostById: Autor com id '${postDto.postInfo.authorId}' não encontrado, mesmo que o post exista. Erro: ${error.message}`);
      }
    }

    return postDto;
  }

  /**
   * Atualiza um post existente.
   * Verifica se o post existe, constrói a expressão de atualização e executa o update no DynamoDB.
   * @param categoryIdSubcategoryId - Chave composta do post
   * @param postId - ID do post a ser atualizado
   * @param updatePostDto - Dados para atualização do post
   * @returns PostDto - O post atualizado, conforme o retorno do DynamoDB
   */
  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    // Verifica se o post existe; se não, getPostById lançará exceção
    await this.getPostById(categoryIdSubcategoryId, postId);

    // Constrói dinamicamente a expressão de atualização com base no DTO fornecido
    const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto);

    // Se não houver campos para atualizar, retorna o post original
    if (!updateExpression) {
      return this.getPostById(categoryIdSubcategoryId, postId);
    }

    // Monta os parâmetros para o comando UpdateItem do DynamoDB, adicionando valores para as chaves obrigatórias
    const params: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
      ...updateExpression,
      ExpressionAttributeValues: {
        ...updateExpression.ExpressionAttributeValues,
        ':categoryId': updatePostDto.categoryId,
        ':subcategoryId': updatePostDto.subcategoryId,
      },
      ReturnValues: 'ALL_NEW',
    };

    // Executa a atualização e mapeia o retorno para o DTO do post
    const result = await this.dynamoDbService.updateItem(params);
    return this.mapDynamoItemToPostDto(result.Attributes as any) as PostDto;
  }

  /**
   * Deleta um post.
   * Verifica se o post existe e então executa o comando DeleteItem no DynamoDB.
   * @param categoryIdSubcategoryId - Chave composta do post
   * @param postId - ID do post a ser deletado
   */
  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    // Verifica se o post existe; se não, getPostById lançará exceção
    await this.getPostById(categoryIdSubcategoryId, postId);

    // Monta os parâmetros para o comando DeleteItem do DynamoDB
    const params: DeleteCommandInput = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };

    // Executa a deleção do post no DynamoDB
    await this.dynamoDbService.deleteItem(params);
  }

  /**
   * Mapeia um item retornado pelo DynamoDB para o DTO do post.
   * Converte os atributos do item (no formato DynamoDB) para os tipos esperados no PostDto.
   * @param item - Item retornado pelo DynamoDB
   * @returns PostDto - O DTO do post mapeado
   */
  private mapDynamoItemToPostDto(item: any): PostDto {
    // LOG 7: Registra o item recebido para mapeamento
    this.logger.log(`mapDynamoItemToPostDto: Item recebido para mapeamento: ${JSON.stringify(item)}`);

    if (!item) {
      // LOG 8: Se o item for undefined ou null, registra um aviso e retorna undefined
      this.logger.warn('mapDynamoItemToPostDto: Item é undefined/null, retornando undefined');
      return undefined;
    }
    try {
      // Converte o item do DynamoDB para o formato do DTO, considerando os tipos de dados (S para string, M para mapa, etc.)
      const postDto: PostDto = {
        'categoryId#subcategoryId': item['categoryId#subcategoryId']?.S,
        postId: item.postId?.S,
        categoryId: item.categoryId?.S,
        subcategoryId: item.subcategoryId?.S,
        contentHTML: item.contentHTML?.S,
        postInfo: item.postInfo?.M
          ? {
            authorId: item.postInfo?.M.authorId?.S,
            tags: item.postInfo?.M.tags?.SS ? Array.from(item.postInfo?.M.tags?.SS) : [],
            excerpt: item.postInfo?.M.excerpt?.S,
            featuredImageURL: item.postInfo?.M.featuredImageURL?.S,
            modifiedDate: item.postInfo?.M.modifiedDate?.S,
            publishDate: item.postInfo?.M.publishDate?.S,
            readingTime: Number(item.postInfo?.M.readingTime?.N),
            slug: item.postInfo?.M.slug?.S,
            status: item.postInfo?.M.status?.S,
            title: item.postInfo?.M.title?.S,
            views: Number(item.postInfo?.M.views?.N),
          }
          : undefined,
        seo: item.seo?.M
          ? {
            canonical: item.seo?.M.canonical?.S,
            description: item.seo?.M.description?.S,
            keywords: item.seo?.M.keywords?.SS ? Array.from(item.seo?.M.keywords?.SS) : [],
          }
          : undefined,
      } as PostDto;

      // LOG 9: Registra o DTO mapeado com sucesso
      this.logger.log(`mapDynamoItemToPostDto: PostDto mapeado com sucesso: ${JSON.stringify(postDto)}`);
      return postDto;
    } catch (error) {
      // LOG 10: Em caso de erro durante o mapeamento, registra o erro e retorna undefined
      this.logger.error(`mapDynamoItemToPostDto: Erro durante o mapeamento: ${error.message}`, error.stack);
      return undefined;
    }
  }
}

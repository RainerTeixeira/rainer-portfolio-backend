// src/modules/blog/posts/services/posts.service.ts

import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common'; // Importa Logger para logging
import { CreatePostDto } from '../dto/create-post.dto'; // Importa DTO para criação de posts
import { UpdatePostDto } from '../dto/update-post.dto'; // Importa DTO para atualização de posts
import { PostDto } from '../dto/post.dto'; // Importa DTO para posts (detalhes básicos)
import { FullPostDto } from '../dto/full-post.dto'; // Importa DTO para posts completos (visão blog)
import { AuthorDto } from '@src/modules/blog/authors/dto/author.dto'; // Importa DTO de Author
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa serviço para interagir com DynamoDB
import { v4 as uuidv4 } from 'uuid'; // Importa UUID v4 para gerar IDs únicos
import { GetCommandInput, ScanCommandInput, PutCommandInput, UpdateCommandInput, DeleteCommandInput } from '@aws-sdk/lib-dynamodb'; // Importa tipos de comandos do AWS SDK for DynamoDB
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service'; // Importa AuthorsService - Serviço de autores

/**
 * @Injectable()
 * @description Serviço responsável por gerenciar posts de blog.
 * Lida com operações CRUD (Criar, Ler, Atualizar, Deletar) para posts e interações com o banco de dados DynamoDB.
 * Utiliza DynamoDbService para abstrair operações de banco de dados e AuthorsService para obter dados relacionados a autores.
 */
@Injectable()
export class PostsService {
  private tableName = 'Posts'; // Define o nome da tabela DynamoDB onde os posts são armazenados
  private readonly logger = new Logger(PostsService.name); // Logger para rastreamento e debug dentro deste serviço

  /**
   * @constructor
   * @param {DynamoDbService} dynamoDbService - Serviço injetado para operações com DynamoDB.
   * @param {AuthorsService} authorsService - Serviço injetado para gerenciamento de autores.
   * @description Injeta instâncias de DynamoDbService e AuthorsService no PostsService.
   * Permite que PostsService utilize os serviços de banco de dados e de autores.
   */
  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private readonly authorsService: AuthorsService // Injeção de dependência do AuthorsService

  ) { }

  /**
   * @async
   * @method createPost
   * @param {string} categoryIdSubcategoryId - Identificador composto da categoria e subcategoria para o post.
   * @param {CreatePostDto} createPostDto - DTO contendo os dados para criar um novo post.
   * @returns {Promise<PostDto>} - Promise que resolve para o PostDto do post recém-criado.
   * @description Cria um novo post no DynamoDB.
   * Gera um identificador único (postId) usando UUID, armazena os dados do post na tabela 'Posts' do DynamoDB,
   * e então recupera e retorna o PostDto do post criado.
   * @throws {HttpException} - Pode lançar HttpException em caso de falha na criação do post.
   */
  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    // this.logger.log(`Criando post em categoria/subcategoria: ${categoryIdSubcategoryId}`); // Log comentado para evitar logs excessivos

    const postId = uuidv4(); // Gera um UUID v4 para servir como ID único do post
    const params: PutCommandInput = {
      TableName: this.tableName, // Usa o nome da tabela definido na classe
      Item: { // Define o item a ser inserido no DynamoDB
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de partição composta
        postId: postId, // Chave de classificação (identificador único do post)
        categoryId: createPostDto.categoryId, // ID da categoria do DTO
        subcategoryId: createPostDto.subcategoryId, // ID da subcategoria do DTO
        contentHTML: createPostDto.contentHTML, // Conteúdo HTML do post do DTO
        postInfo: createPostDto.postInfo, // Informações adicionais do post do DTO (autor, tags, etc.)
        seo: createPostDto.seo, // Informações de SEO do post do DTO
      },
    };

    await this.dynamoDbService.putItem(params); // Chama o serviço DynamoDbService para inserir o item
    return this.getPostById(categoryIdSubcategoryId, postId); // Após inserir, recupera e retorna o post pelo ID
  }

  /**
   * @async
   * @method getAllPosts
   * @returns {Promise<PostDto[]>} - Promise que resolve para um array de PostDto, representando todos os posts.
   * @description Recupera todos os posts do DynamoDB.
   * Utiliza a operação de Scan do DynamoDB para buscar todos os itens da tabela 'Posts'.
   * Nota: Scan pode ser ineficiente para tabelas muito grandes; considerar paginação ou Query para produção.
   * Mapeia cada item do DynamoDB retornado para um PostDto antes de retornar a lista.
   *
   * @performance Para aplicações com muitos posts, a operação de Scan pode se tornar lenta e custosa.
   *              Em produção, é altamente recomendável implementar paginação ou utilizar Query com índices
   *              para recuperar dados de forma mais eficiente.
   */
  async getAllPosts(): Promise<PostDto[]> {
    // this.logger.log('Recuperando todos os posts'); // Log comentado para evitar logs excessivos

    const params: ScanCommandInput = {
      TableName: this.tableName, // Usa o nome da tabela definido na classe
    };

    const result = await this.dynamoDbService.scan(params); // Chama o serviço DynamoDbService para executar Scan
    const items = result.Items; // Extrai a lista de itens do resultado do Scan

    if (!items || items.length === 0) {
      return []; // Retorna um array vazio caso não encontre nenhum post
    }

    return items.map(item => this.mapDynamoItemToPostDto(item)) as PostDto[]; // Mapeia cada item para PostDto e retorna array
  }

  /**
   * @async
   * @method getPostById
   * @param {string} categoryIdSubcategoryId - Identificador composto da categoria e subcategoria.
   * @param {string} postId - Identificador único do post a ser recuperado.
   * @returns {Promise<PostDto>} - Promise que resolve para o PostDto se o post for encontrado.
   * @throws {NotFoundException} - Lança NotFoundException se o post não for encontrado no DynamoDB.
   * @description Recupera um post específico do DynamoDB usando categoryIdSubcategoryId e postId como chaves.
   * Utiliza GetCommand para buscar um item específico na tabela 'Posts' do DynamoDB.
   * Se o post é encontrado, ele é mapeado para um PostDto. Se não, lança um erro NotFoundException.
   * Opcionalmente, busca e adiciona o nome do autor ao PostDto utilizando AuthorsService.
   */
  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    this.logger.log(`getPostById: Iniciando busca do post. categoryIdSubcategoryId: ${categoryIdSubcategoryId}, postId: ${postId}`); // LOG 1: Log ao iniciar a busca
    const params: GetCommandInput = {
      TableName: this.tableName, // Usa o nome da tabela definido na classe
      Key: { // Define a chave para a operação GetItem do DynamoDB
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de partição
        postId: postId, // Chave de classificação
      },
    };
    this.logger.log(`getPostById: Parametros para DynamoDB: ${JSON.stringify(params)}`); // LOG 2: Log dos parâmetros do DynamoDB

    const result = await this.dynamoDbService.getItem(params); // Chama o serviço DynamoDbService para executar GetItem
    this.logger.log(`getPostById: Resultado bruto do DynamoDB: ${JSON.stringify(result)}`); // LOG 3: Log do resultado bruto do DynamoDB
    const item = result.Item; // Extrai o item do resultado

    if (!item) {
      this.logger.warn(`getPostById: Post não encontrado no DynamoDB. categoryIdSubcategoryId: ${categoryIdSubcategoryId}, postId: ${postId}`); // LOG 5: Log de aviso caso post não encontrado
      throw new NotFoundException(`Post com ID '${postId}' na categoria '${categoryIdSubcategoryId}' não encontrado`); // Lança exceção se post não existe
    }

    const postDto = this.mapDynamoItemToPostDto(item); // Mapeia o item do DynamoDB para PostDto
    this.logger.log(`getPostById: PostDto mapeado: ${JSON.stringify(postDto)}`); // LOG 6: Log do PostDto mapeado

    // Buscar e adicionar o nome do autor
    if (postDto.postInfo && postDto.postInfo.authorId) {
      try {
        const authorDto = await this.authorsService.getAuthorById(postDto.postInfo.authorId); // Busca informações do autor usando AuthorsService
        postDto.postInfo.authorName = authorDto.name; // Adiciona o nome do autor ao PostDto
        this.logger.log(`getPostById: Nome do autor '${authorDto.name}' adicionado ao PostDto.`); // Log de sucesso ao adicionar nome do autor
      } catch (error) {
        this.logger.warn(`getPostById: Autor com id '${postDto.postInfo.authorId}' não encontrado, mesmo que o post exista. Erro: ${error.message}`); // Log de aviso se autor não encontrado
        // Não lança exceção, apenas loga e continua sem o nome do autor (comportamento opcional)
      }
    }

    return postDto; // Retorna o PostDto
  }

  /**
   * @async
   * @method updatePost
   * @param {string} categoryIdSubcategoryId - Identificador composto da categoria e subcategoria.
   * @param {string} postId - Identificador único do post a ser atualizado.
   * @param {UpdatePostDto} updatePostDto - DTO contendo os dados para atualizar o post.
   * @returns {Promise<PostDto>} - Promise que resolve para o PostDto atualizado.
   * @throws {NotFoundException} - Lança NotFoundException se o post a ser atualizado não for encontrado.
   * @description Atualiza um post existente no DynamoDB.
   * Primeiro, verifica se o post existe chamando getPostById.
   * Constrói uma expressão de atualização utilizando DynamoDbService para atualizar apenas os campos fornecidos em updatePostDto.
   * Atualiza o item no DynamoDB e então recupera e retorna o PostDto atualizado.
   */
  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    // this.logger.log(`Atualizando post com ID: ${postId}`); // Log comentado para evitar logs excessivos

    await this.getPostById(categoryIdSubcategoryId, postId); // Garante que o post existe; NotFoundException é lançado se não existir

    const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto); // Constrói a expressão de atualização dinamicamente

    if (!updateExpression) {
      return this.getPostById(categoryIdSubcategoryId, postId); // Se não há nada para atualizar, retorna o post existente
    }

    const params: UpdateCommandInput = {
      TableName: this.tableName, // Usa o nome da tabela definido na classe
      Key: { // Define a chave para a operação UpdateItem do DynamoDB
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de partição
        postId: postId, // Chave de classificação
      },
      ...updateExpression, // Aplica a expressão de atualização construída
      ExpressionAttributeValues: { // Define os valores para os placeholders na expressão de atualização
        ...updateExpression.ExpressionAttributeValues, // Inclui valores existentes
        ':categoryId': updatePostDto.categoryId, // Define valor para categoryId
        ':subcategoryId': updatePostDto.subcategoryId, // Define valor para subcategoryId
      },
      ReturnValues: 'ALL_NEW', // Retorna todos os atributos do item APÓS a atualização
    };

    const result = await this.dynamoDbService.updateItem(params); // Chama o serviço DynamoDbService para executar UpdateItem
    return this.mapDynamoItemToPostDto(result.Attributes as any) as PostDto; // Mapeia e retorna o PostDto atualizado
  }

  /**
   * @async
   * @method deletePost
   * @param {string} categoryIdSubcategoryId - Identificador composto da categoria e subcategoria.
   * @param {string} postId - Identificador único do post a ser deletado.
   * @returns {Promise<void>} - Promise que resolve para void após a deleção bem-sucedida.
   * @throws {NotFoundException} - Lança NotFoundException se o post a ser deletado não for encontrado.
   * @description Deleta um post do DynamoDB.
   * Primeiro, verifica se o post existe chamando getPostById.
   * Se o post existir, utiliza DeleteCommand para removê-lo da tabela 'Posts' do DynamoDB.
   */
  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    // this.logger.log(`Deletando post com ID: ${postId}`); // Log comentado para evitar logs excessivos

    await this.getPostById(categoryIdSubcategoryId, postId); // Garante que o post existe; NotFoundException é lançado se não existir

    const params: DeleteCommandInput = {
      TableName: this.tableName, // Usa o nome da tabela definido na classe
      Key: { // Define a chave para a operação DeleteItem do DynamoDB
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de partição
        postId: postId, // Chave de classificação
      },
    };

    await this.dynamoDbService.deleteItem(params); // Chama o serviço DynamoDbService para executar DeleteItem
  }

  /**
   * @private
   * @method mapDynamoItemToPostDto
   * @param {any} item - Item retornado do DynamoDB que precisa ser mapeado para PostDto.
   * @returns {PostDto} - PostDto resultante do mapeamento do item do DynamoDB.
   * @description Mapeia um item do DynamoDB (formato de dados do AWS SDK) para um PostDto (formato de dados da aplicação).
   * Realiza a conversão de tipos de dados do DynamoDB (ex: {S: 'string'} para 'string', {N: '123'} para 123),
   * especialmente para atributos aninhados como 'postInfo' e 'seo' que são armazenados como Maps no DynamoDB.
   * Inclui tratamento de erros e logs para facilitar o debug e garantir a robustez do mapeamento.
   */
  private mapDynamoItemToPostDto(item: any): PostDto {
    this.logger.log(`mapDynamoItemToPostDto: Item recebido para mapeamento: ${JSON.stringify(item)}`); // LOG 7: Log item recebido para mapeamento
    if (!item) {
      this.logger.warn('mapDynamoItemToPostDto: Item é undefined/null, retornando undefined'); // LOG 8: Log de aviso se item for nulo
      return undefined; // Retorna undefined se o item for nulo ou indefinido
    }
    try { // Bloco try-catch para tratamento de erros durante o mapeamento
      const postDto: PostDto = {
        'categoryId#subcategoryId': item['categoryId#subcategoryId']?.S, // Mapeia atributo categoryId#subcategoryId (String)
        postId: item.postId?.S, // Mapeia atributo postId (String)
        categoryId: item.categoryId?.S, // Mapeia atributo categoryId (String)
        subcategoryId: item.subcategoryId?.S, // Mapeia atributo subcategoryId (String)
        contentHTML: item.contentHTML?.S, // Mapeia atributo contentHTML (String)
        postInfo: item.postInfo?.M ? { // Mapeia atributo postInfo (Map), se existir
          authorId: item.postInfo?.M.authorId?.S, // Mapeia atributo authorId dentro de postInfo (String)
          tags: item.postInfo?.M.tags?.SS ? Array.from(item.postInfo?.M.tags?.SS) : [], // Mapeia atributo tags dentro de postInfo (String Set para Array de Strings)
          excerpt: item.postInfo?.M.excerpt?.S, // Mapeia atributo excerpt dentro de postInfo (String)
          featuredImageURL: item.postInfo?.M.featuredImageURL?.S, // Mapeia atributo featuredImageURL dentro de postInfo (String)
          modifiedDate: item.postInfo?.M.modifiedDate?.S, // Mapeia atributo modifiedDate dentro de postInfo (String)
          publishDate: item.postInfo?.M.publishDate?.S, // Mapeia atributo publishDate dentro de postInfo (String)
          readingTime: Number(item.postInfo?.M.readingTime?.N), // Mapeia atributo readingTime dentro de postInfo (Number)
          slug: item.postInfo?.M.slug?.S, // Mapeia atributo slug dentro de postInfo (String)
          status: item.postInfo?.M.status?.S, // Mapeia atributo status dentro de postInfo (String)
          title: item.postInfo?.M.title?.S, // Mapeia atributo title dentro de postInfo (String)
          views: Number(item.postInfo?.M.views?.N), // Mapeia atributo views dentro de postInfo (Number)
        } : undefined, // Se postInfo não for um Map no DynamoDB, define como undefined
        seo: item.seo?.M ? { // Mapeia atributo seo (Map), se existir
          canonical: item.seo?.M.canonical?.S, // Mapeia atributo canonical dentro de seo (String)
          description: item.seo?.M.description?.S, // Mapeia atributo description dentro de seo (String)
          keywords: item.seo?.M.keywords?.SS ? Array.from(item.seo?.M.keywords?.SS) : [], // Mapeia atributo keywords dentro de seo (String Set para Array de Strings)
        } : undefined, // Se seo não for um Map no DynamoDB, define como undefined
      } as PostDto;
      this.logger.log(`mapDynamoItemToPostDto: PostDto mapeado com sucesso: ${JSON.stringify(postDto)}`); // LOG 9: Log de sucesso no mapeamento
      return postDto; // Retorna o PostDto mapeado
    } catch (error) {
      this.logger.error(`mapDynamoItemToPostDto: Erro durante o mapeamento: ${error.message}`, error.stack); // LOG 10: Log de erro durante o mapeamento
      return undefined; // Retorna undefined em caso de erro no mapeamento
    }
  }

  /**
   * @async
   * @method getFullPostById
   * @param {string} categoryIdSubcategoryId - Identificador composto da categoria e subcategoria.
   * @param {string} postId - Identificador único do post.
   * @returns {Promise<FullPostDto>} - Promise que resolve para o FullPostDto se o post for encontrado.
   * @throws {NotFoundException} - Não lança diretamente, mas `getPostById` pode lançar NotFoundException.
   * @description Recupera um post específico do DynamoDB com detalhes completos (FullPostDto).
   * Atualmente, este método simplesmente chama `getPostById` para buscar os detalhes básicos do post e os retorna como um FullPostDto.
   * Em versões futuras, este método pode ser expandido para incluir dados adicionais no FullPostDto,
   * como comentários, reações de usuários, ou informações mais detalhadas do autor.
   * Por ora, ele garante a compatibilidade com FullPostDto e pode ser expandido sem quebrar a API.
   */
  async getFullPostById(categoryIdSubcategoryId: string, postId: string): Promise<FullPostDto> {
    const postDto = await this.getPostById(categoryIdSubcategoryId, postId); // Busca o PostDto básico

    if (!postDto) {
      return undefined; // Retorna undefined se postDto for null ou undefined (post não encontrado)
    }

    const fullPostDto: FullPostDto = {
      ...postDto, // Espalha todas as propriedades de PostDto em FullPostDto
      // Em futuras implementações, dados adicionais para FullPostDto (ex: comentários, detalhes extras do autor) poderiam ser adicionados aqui.
    };

    return fullPostDto; // Retorna o FullPostDto, que no momento é funcionalmente igual ao PostDto, mas preparado para extensões.
  }
}
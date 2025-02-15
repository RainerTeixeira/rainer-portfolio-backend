//src/modules/blog/posts/services/posts.service.ts

import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common'; // Importe Logger
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';
import { AuthorDto } from '@src/modules/blog/authors/dto/author.dto'; // Importe AuthorDto  (Corrected import - was importing PostDto again by mistake)
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { v4 as uuidv4 } from 'uuid';
import { GetCommandInput, ScanCommandInput, PutCommandInput, UpdateCommandInput, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service'; // Import AuthorsService - Make sure the path is correct

@Injectable()
export class PostsService {
  private tableName = 'Posts';
  private readonly logger = new Logger(PostsService.name); // Logger

  constructor(
    private readonly dynamoDbService: DynamoDbService,
    private readonly authorsService: AuthorsService // Injete o AuthorsService - Already Injected Correctly

  ) { }

  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    // ... (código createPost - não precisa de logs aqui por enquanto)
    const postId = uuidv4();
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

    await this.dynamoDbService.putItem(params);
    return this.getPostById(categoryIdSubcategoryId, postId);
  }

  async getAllPosts(): Promise<PostDto[]> {
    // ... (código getAllPosts - não precisa de logs aqui por enquanto, já está funcionando aparentemente)
    const params: ScanCommandInput = {
      TableName: this.tableName,
    };

    const result = await this.dynamoDbService.scan(params);
    const items = result.Items;

    if (!items || items.length === 0) {
      return [];
    }

    return items.map(item => this.mapDynamoItemToPostDto(item)) as PostDto[];
  }

  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    this.logger.log(`getPostById: Iniciando busca do post. categoryIdSubcategoryId: ${categoryIdSubcategoryId}, postId: ${postId}`); // LOG 1: Parâmetros de entrada
    const params: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };
    this.logger.log(`getPostById: Parametros para DynamoDB: ${JSON.stringify(params)}`); // LOG 2: Parametros do DynamoDB

    const result = await this.dynamoDbService.getItem(params);
    this.logger.log(`getPostById: Resultado bruto do DynamoDB: ${JSON.stringify(result)}`); // LOG 3: Resultado bruto do DynamoDB
    const item = result.Item;
    this.logger.log(`getPostById: Item do DynamoDB (result.Item): ${JSON.stringify(item)}`); // LOG 4: Item do DynamoDB (result.Item)

    if (!item) {
      this.logger.warn(`getPostById: Post não encontrado no DynamoDB. categoryIdSubcategoryId: ${categoryIdSubcategoryId}, postId: ${postId}`); // LOG 5: Post não encontrado (WARN)
      throw new NotFoundException(`Post com ID '${postId}' na categoria '${categoryIdSubcategoryId}' não encontrado`);
    }

    const postDto = this.mapDynamoItemToPostDto(item);
    this.logger.log(`getPostById: PostDto mapeado: ${JSON.stringify(postDto)}`); // LOG 6: PostDto mapeado

    // Buscar e adicionar o nome do autor
    if (postDto.postInfo && postDto.postInfo.authorId) {
      try {
        const authorDto = await this.authorsService.getAuthorById(postDto.postInfo.authorId);
        postDto.postInfo.authorName = authorDto.name; // Adiciona o nome do autor no postDto
        this.logger.log(`getPostById: Nome do autor '${authorDto.name}' adicionado ao PostDto.`); // Log de sucesso ao adicionar nome do autor
      } catch (error) {
        this.logger.warn(`getPostById: Autor com id '${postDto.postInfo.authorId}' não encontrado, mesmo que o post exista. Erro: ${error.message}`); // Log de warning caso autor não seja encontrado
        // Não lança erro, apenas loga e segue sem o nome do autor (opcional, dependendo do requisito)
      }
    }

    return postDto;
  }

  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    // ... (código updatePost - não precisa de logs aqui por enquanto)
    await this.getPostById(categoryIdSubcategoryId, postId);

    const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto);

    if (!updateExpression) {
      return this.getPostById(categoryIdSubcategoryId, postId);
    }

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


    const result = await this.dynamoDbService.updateItem(params);
    return this.mapDynamoItemToPostDto(result.Attributes as any) as PostDto;
  }

  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    // ... (código deletePost - não precisa de logs aqui por enquanto)
    await this.getPostById(categoryIdSubcategoryId, postId);

    const params: DeleteCommandInput = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };

    await this.dynamoDbService.deleteItem(params);
  }


  private mapDynamoItemToPostDto(item: any): PostDto {
    this.logger.log(`mapDynamoItemToPostDto: Item recebido para mapeamento: ${JSON.stringify(item)}`); // LOG 7: Item recebido no mapeamento
    if (!item) {
      this.logger.warn('mapDynamoItemToPostDto: Item é undefined/null, retornando undefined'); // LOG 8: Item undefined/null (WARN)
      return undefined;
    }
    try { // Adicionando bloco try-catch para capturar erros no mapeamento
      const postDto: PostDto = {
        'categoryId#subcategoryId': item['categoryId#subcategoryId']?.S,
        postId: item.postId?.S,
        categoryId: item.categoryId?.S,
        subcategoryId: item.subcategoryId?.S,
        contentHTML: item.contentHTML?.S,
        postInfo: item.postInfo?.M ? {
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
        } : undefined,
        seo: item.seo?.M ? {
          canonical: item.seo?.M.canonical?.S,
          description: item.seo?.M.description?.S,
          keywords: item.seo?.M.keywords?.SS ? Array.from(item.seo?.M.keywords?.SS) : [],
        } : undefined,
      } as PostDto;
      this.logger.log(`mapDynamoItemToPostDto: PostDto mapeado com sucesso: ${JSON.stringify(postDto)}`); // LOG 9: PostDto mapeado com sucesso
      return postDto;
    } catch (error) {
      this.logger.error(`mapDynamoItemToPostDto: Erro durante o mapeamento: ${error.message}`, error.stack); // LOG 10: Erro no mapeamento (ERROR)
      return undefined; // Retorna undefined em caso de erro no mapeamento
    }
  }
}
//src/modules/blog/posts/services/posts.service.ts

import { Injectable, NotFoundException, Inject } from '@nestjs/common'; // Importe Inject
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importe DynamoDbService
import { v4 as uuidv4 } from 'uuid';
import { GetCommandInput, ScanCommandInput, PutCommandInput, UpdateCommandInput, DeleteCommandInput } from '@aws-sdk/lib-dynamodb'; // Importe tipos de comando

@Injectable()
export class PostsService {
  private tableName = 'Posts'; // Nome da tabela no DynamoDB

  constructor(
    private readonly dynamoDbService: DynamoDbService, // Injeta DynamoDbService
  ) { }

  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    const postId = uuidv4();
    const params: PutCommandInput = { // Define tipo PutCommandInput
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

    await this.dynamoDbService.putItem(params); // Usa putItem do DynamoDbService

    return this.getPostById(categoryIdSubcategoryId, postId); // Busca o post recém-criado para retornar
  }

  async getAllPosts(): Promise<PostDto[]> {
    const params: ScanCommandInput = { // Define tipo ScanCommandInput
      TableName: this.tableName,
    };

    const result = await this.dynamoDbService.scan(params); // Usa scan do DynamoDbService
    const items = result.Items; // Pega os Items do resultado do scan

    if (!items || items.length === 0) {
      return []; // Retorna array vazio se não houver posts
    }

    return items.map(item => this.mapDynamoItemToPostDto(item)) as PostDto[]; // Mapeia para PostDto[]
  }

  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    const params: GetCommandInput = { // Define tipo GetCommandInput
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };

    const result = await this.dynamoDbService.getItem(params); // Usa getItem do DynamoDbService
    const item = result.Item; // Pega o Item do resultado do getItem

    if (!item) {
      throw new NotFoundException(`Post com ID '${postId}' na categoria '${categoryIdSubcategoryId}' não encontrado`);
    }

    return this.mapDynamoItemToPostDto(item); // Mapeia para PostDto
  }

  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    await this.getPostById(categoryIdSubcategoryId, postId); // Verifica se o post existe

    const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto); // Usa buildUpdateExpression do DynamoDbService

    if (!updateExpression) {
      return this.getPostById(categoryIdSubcategoryId, postId); // Se não houver nada para atualizar, retorna o post existente
    }

    const params: UpdateCommandInput = { // Define tipo UpdateCommandInput
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
      ...updateExpression, // Usa UpdateExpression construída
      ExpressionAttributeValues: { // Garante que ExpressionAttributeValues está definido e não é undefined
        ...updateExpression.ExpressionAttributeValues,
        ':categoryId': updatePostDto.categoryId, // Adiciona categoryId no update
        ':subcategoryId': updatePostDto.subcategoryId, // Adiciona subcategoryId no update
      },
      ReturnValues: 'ALL_NEW',
    };


    const result = await this.dynamoDbService.updateItem(params); // Usa updateItem do DynamoDbService
    return this.mapDynamoItemToPostDto(result.Attributes as any) as PostDto; // Mapeia para PostDto
  }

  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    await this.getPostById(categoryIdSubcategoryId, postId); // Verifica se o post existe

    const params: DeleteCommandInput = { // Define tipo DeleteCommandInput
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };

    await this.dynamoDbService.deleteItem(params); // Usa deleteItem do DynamoDbService
  }


  private mapDynamoItemToPostDto(item: any): PostDto {
    if (!item) {
      return undefined;
    }
    return {
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
  }
}
// src/modules/blog/posts/services/posts.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from '@src/modules/blog/posts/dto/create-post.dto';
import { UpdatePostDto } from '@src/modules/blog/posts/dto/update-post.dto';
import { PostDto } from '@src/modules/blog/posts/dto/post.dto';
import { DynamoDbService } from '@src/services/dynamoDb.service'; // Importa DynamoDbService usando alias @src.
import { UpdateCommandInput } from '@aws-sdk/lib-dynamodb'; // Importe UpdateCommandInput

@Injectable()
export class PostsService {
  private readonly tableName = 'Posts'; // Nome da tabela DynamoDB para Posts

  constructor(private readonly dynamoDbService: DynamoDbService) { } // Injeta DynamoDbService

  async create(createPostDto: CreatePostDto): Promise<PostDto> {
    const params = {
      TableName: this.tableName,
      Item: createPostDto,
    };
    await this.dynamoDbService.putItem(params);
    return this.findOne(createPostDto.categoryId + '#' + createPostDto.subcategoryId, createPostDto.postId);
  }

  async findAll(): Promise<PostDto[]> {
    const result = await this.dynamoDbService.scan({ TableName: this.tableName });
    return (result.Items || []).map(item => this.mapPostFromDynamoDb(item));
  }

  async findOne(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': { S: categoryIdSubcategoryId }, // Chave composta
        postId: { S: postId },
      },
    };
    const result = await this.dynamoDbService.getItem(params);
    if (!result.Item) {
      throw new NotFoundException(`Post com ID '<span class="math-inline">\{postId\}' na categoria '</span>{categoryIdSubcategoryId}' não encontrado`);
    }
    return this.mapPostFromDynamoDb(result.Item);
  }

  async update(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    // Verifica se o post existe antes de atualizar
    await this.findOne(categoryIdSubcategoryId, postId);

    const params: UpdateCommandInput = { // Use UpdateCommandInput type
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': { S: categoryIdSubcategoryId }, // Chave composta
        postId: { S: postId },
      },
      UpdateExpression: 'SET contentHTML = :contentHTML, excerpt = :excerpt, publishDate = :publishDate, slug = :slug, title = :title, postInfo = :postInfo, seo = :seo, #status = :status', // UpdateExpression
      ExpressionAttributeNames: {
        '#status': 'status', // Para 'status' (palavra reservada)
      },
      ExpressionAttributeValues: {
        ':contentHTML': { S: updatePostDto.contentHTML },
        ':excerpt': { S: updatePostDto.excerpt },
        ':publishDate': { S: updatePostDto.publishDate },
        ':slug': { S: updatePostDto.slug },
        ':title': { S: updatePostDto.title },
        ':postInfo': {
          M: { // Mapeando 'postInfo'
            authorId: { S: updatePostDto.postInfo?.authorId || null },
            tags: { L: updatePostDto.postInfo?.tags?.map(tag => ({ S: tag })) || [] },
          }
        },
        ':seo': {
          M: { // Mapeando 'seo'
            canonical: { S: updatePostDto.seo?.canonical || null },
            description: { S: updatePostDto.seo?.description || null },
            keywords: { L: updatePostDto.seo?.keywords?.map(keyword => ({ S: keyword })) || [] },
          }
        },
        ':status': { S: updatePostDto.status || 'draft' }, // Valor padrão 'draft' para status
      },
      ReturnValues: 'ALL_NEW',
    };

    const result = await this.dynamoDbService.updateItem(params);
    return this.mapPostFromDynamoDb(result.Attributes as Record<string, any>) as PostDto;
  }

  async remove(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    // Verifica se o post existe antes de deletar
    await this.findOne(categoryIdSubcategoryId, postId);

    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': { S: categoryIdSubcategoryId }, // Chave composta
        postId: { S: postId },
      },
    };
    await this.dynamoDbService.deleteItem(params);
  }


  private mapPostFromDynamoDb(item: Record<string, any>): PostDto {
    return {
      'categoryId#subcategoryId': item['categoryId#subcategoryId']?.S, // Acessa chave composta usando index signature
      postId: item.postId?.S,
      categoryId: item.categoryId?.S,
      subcategoryId: item.subcategoryId?.S,
      contentHTML: item.contentHTML?.S,
      postInfo: { // Mapeia objeto 'postInfo'
        authorId: item.postInfo?.M?.authorId?.S,
        tags: item.postInfo?.M?.tags?.L?.map((tagItem: any) => tagItem.S) || [],
        likes: Number(item.postInfo?.M?.likes?.N),
        views: Number(item.postInfo?.M?.views?.N),
      },
      excerpt: item.excerpt?.S,
      publishDate: item.publishDate?.S,
      slug: item.slug?.S,
      title: item.title?.S,
      status: item.status?.S,
      seo: { // Mapeia objeto 'seo'
        canonical: item.seo?.M?.canonical?.S,
        description: item.seo?.M?.description?.S,
        keywords: item.seo?.M?.keywords?.L?.map((keywordItem: any) => keywordItem.S) || []
      },
    } as PostDto;
  }
}
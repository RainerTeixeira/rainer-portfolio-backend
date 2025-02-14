// src/modules/blog/posts/services/posts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { CreatePostDto } from '../dto/create-post.dto'; // Importe CreatePostDto
import { UpdatePostDto } from '../dto/update-post.dto'; // Importe UpdatePostDto
import { PostDto } from '../dto/post.dto'; // Importe PostDto

@Injectable()
export class PostsService {
  private dynamoDb: DynamoDB.DocumentClient;
  private tableName = 'Posts';

  constructor() {
    this.dynamoDb = new DynamoDB.DocumentClient({ region: 'us-east-1' }); // ajuste a região se necessário
  }

  async createPost(categoryIdSubcategoryId: string, createPostDto: CreatePostDto): Promise<PostDto> {
    const postId = uuidv4();
    const params = {
      TableName: this.tableName,
      Item: {
        'categoryId#subcategoryId': categoryIdSubcategoryId, // Chave de Partição Composta
        postId: postId,                                  // Chave de Classificação
        categoryId: createPostDto.categoryId,
        subcategoryId: createPostDto.subcategoryId,
        contentHTML: createPostDto.contentHTML,
        postInfo: createPostDto.postInfo,
        seo: createPostDto.seo,
      },
    };

    await this.dynamoDb.put(params).promise();

    return { ...params.Item } as PostDto; // Retorna o item criado como PostDto
  }


  async getPostById(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };

    const result = await this.dynamoDb.get(params).promise();

    if (!result.Item) {
      throw new NotFoundException(`Post com ID '${postId}' na categoria '${categoryIdSubcategoryId}' não encontrado`);
    }

    return result.Item as PostDto;
  }

  async updatePost(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
      UpdateExpression: 'set #contentHTML = :contentHTML, #postInfo = :postInfo, #seo = :seo, categoryId = :categoryId, subcategoryId = :subcategoryId', // Corrigido UpdateExpression
      ExpressionAttributeNames: {
        '#contentHTML': 'contentHTML',
        '#postInfo': 'postInfo',
        '#seo': 'seo',
      },
      ExpressionAttributeValues: {
        ':contentHTML': updatePostDto.contentHTML,
        ':postInfo': updatePostDto.postInfo,
        ':seo': updatePostDto.seo,
        ':categoryId': updatePostDto.categoryId, // Adicionado categoryId
        ':subcategoryId': updatePostDto.subcategoryId, // Adicionado subcategoryId
      },
      ReturnValues: 'ALL_NEW',
    };


    const result = await this.dynamoDb.update(params).promise();
    return result.Attributes as PostDto;
  }


  async deletePost(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': categoryIdSubcategoryId,
        postId: postId,
      },
    };

    await this.dynamoDb.delete(params).promise();
  }

  async getAllPosts(): Promise<PostDto[]> {
    const params = {
      TableName: this.tableName,
      // IndexName: 'PostsIndex', // Se você tiver um GSI para consulta por todos os posts, descomente e use o nome do índice
    };

    const result = await this.dynamoDb.scan(params).promise(); // ou query se usar GSI


    return result.Items.map(item => {
      return {
        'categoryId#subcategoryId': item['categoryId#subcategoryId']?.S,
        postId: item.postId?.S,
        categoryId: item.categoryId?.S,
        subcategoryId: item.subcategoryId?.S,
        contentHTML: item.contentHTML?.S,
        postInfo: item.postInfo?.M ? { // Ajuste para garantir que postInfo e suas propriedades existam
          authorId: item.postInfo?.M.authorId?.S,
          tags: item.postInfo?.M.tags?.SS,
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
        seo: item.seo?.M ? {  // Ajuste para garantir que seo e suas propriedades existam
          canonical: item.seo?.M.canonical?.S,
          description: item.seo?.M.description?.S,
          keywords: item.seo?.M.keywords?.SS,
        } : undefined,
      } as PostDto;
    });
  }
}
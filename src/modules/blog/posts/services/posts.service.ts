// src/modules/blog/posts/services/posts.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '../../../../services/dynamoDb.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';

@Injectable()
export class PostsService {
  private readonly tableName = 'Posts';

  constructor(private readonly dynamoDbService: DynamoDbService) { }

  async create(createPostDto: CreatePostDto): Promise<PostDto> {
    const categorySubcategoryId = `${createPostDto.categoryId}#${createPostDto.subcategoryId}`;
    const postId = this.generatePostId(); // Gere um postId único aqui (ex: UUID)

    const params = {
      TableName: this.tableName,
      Item: {
        ...createPostDto,
        'categoryId#subcategoryId': categorySubcategoryId, // Chave de partição composta
        postId: postId, // Gera um postId único
      },
    };
    await this.dynamoDbService.putItem(params);
    return this.findOne(categorySubcategoryId, postId);
  }

  async findAll(): Promise<PostDto[]> {
    const params = {
      TableName: this.tableName,
    };
    const result = await this.dynamoDbService.scanItems(params);
    return (result.Items as PostDto[]) || [];
  }

  async findOne(categoryIdSubcategoryId: string, postId: string): Promise<PostDto> {
    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
        postId: { S: postId },
      },
    };
    const result = await this.dynamoDbService.getItem(params);
    if (!result.Item) {
      throw new NotFoundException(`Post com categoryId#subcategoryId '${categoryIdSubcategoryId}' e postId '${postId}' não encontrado`);
    }
    return result.Item as PostDto;
  }

  async update(categoryIdSubcategoryId: string, postId: string, updatePostDto: UpdatePostDto): Promise<PostDto> {
    await this.findOne(categoryIdSubcategoryId, postId);
    const updateExpression = this.dynamoDbService.buildUpdateExpression(updatePostDto);
    if (!updateExpression) {
      return this.findOne(categoryIdSubcategoryId, postId);
    }

    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
        postId: { S: postId },
      },
      ...updateExpression,
      ReturnValues: 'ALL_NEW',
    };

    const result = await this.dynamoDbService.updateItem(params);
    return result.Attributes as PostDto;
  }

  async remove(categoryIdSubcategoryId: string, postId: string): Promise<void> {
    await this.findOne(categoryIdSubcategoryId, postId);
    const params = {
      TableName: this.tableName,
      Key: {
        'categoryId#subcategoryId': { S: categoryIdSubcategoryId },
        postId: { S: postId },
      },
    };
    await this.dynamoDbService.deleteItem(params);
  }

  private generatePostId(): string {
    // Implemente sua lógica para gerar um PostId único (ex: UUID, nanoid, etc.)
    // Para simplificar, um exemplo básico com timestamp e random:
    return `mbx9zi-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
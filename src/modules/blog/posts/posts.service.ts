import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { CreatePostDto, UpdatePostDto } from './dto';

@Injectable()
export class PostsService {
  private readonly tableName = process.env.DYNAMO_TABLE_NAME_POSTS;
  private readonly docClient: DynamoDBDocumentClient;

  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoDBClient: DynamoDBClient,
  ) {
    this.docClient = DynamoDBDocumentClient.from(this.dynamoDBClient, {
      marshallOptions: { removeUndefinedValues: true },
      unmarshallOptions: { wrapNumbers: false },
    });
  }

  private handleDynamoError(error: unknown, context: string) {
    console.error(`Erro no DynamoDB (${context}):`, error);
    throw new BadRequestException(`Falha ao ${context}`);
  }

  async create(createPostDto: CreatePostDto) {
    try {
      const post = {
        postId: Date.now().toString(),
        ...createPostDto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: post,
        }),
      );

      return post;
    } catch (error) {
      this.handleDynamoError(error, 'criar post');
    }
  }

  async findAll(query: { limit?: string; lastKey?: string }) {
    try {
      const limit = Math.min(Number(query.limit) || 20, 100);
      const ExclusiveStartKey = query.lastKey
        ? JSON.parse(Buffer.from(query.lastKey, 'base64').toString('utf-8'))
        : undefined;

      const { Items, LastEvaluatedKey } = await this.docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          Limit: limit,
          ExclusiveStartKey,
        }),
      );

      return {
        data: Items || [],
        meta: {
          count: Items?.length || 0,
          nextCursor: LastEvaluatedKey
            ? Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64')
            : null,
        },
      };
    } catch (error) {
      this.handleDynamoError(error, 'buscar posts');
    }
  }

  async findOne(id: string) {
    try {
      const { Item } = await this.docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { postId: id },
        }),
      );

      if (!Item) {
        throw new NotFoundException('Post não encontrado');
      }

      return Item;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDynamoError(error, 'buscar post');
    }
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    try {
      const updateKeys = Object.keys(updatePostDto);
      if (updateKeys.length === 0) {
        throw new BadRequestException('Nenhum campo fornecido para atualização');
      }

      const updateExpressions = updateKeys
        .map((_, index) => `#field${index} = :value${index}`)
        .join(', ');

      const expressionAttributeNames = updateKeys.reduce(
        (acc, key, index) => ({ ...acc, [`#field${index}`]: key }),
        {},
      );

      const expressionAttributeValues = updateKeys.reduce(
        (acc, key, index) => ({ ...acc, [`:value${index}`]: updatePostDto[key as keyof UpdatePostDto] }), // Evitar uso de any
        {},
      );

      const { Attributes } = await this.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { postId: id },
          UpdateExpression: `SET ${updateExpressions}, updatedAt = :updatedAt`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: {
            ...expressionAttributeValues,
            ':updatedAt': new Date().toISOString(),
          },
          ReturnValues: 'ALL_NEW',
        }),
      );

      if (!Attributes) {
        throw new NotFoundException('Post não encontrado para atualização');
      }

      return Attributes;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDynamoError(error, 'atualizar post');
    }
  }

  async remove(id: string) {
    try {
      await this.docClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { postId: id },
        }),
      );

      return { success: true, message: 'Post excluído com sucesso' };
    } catch (error) {
      this.handleDynamoError(error, 'excluir post');
    }
  }
}

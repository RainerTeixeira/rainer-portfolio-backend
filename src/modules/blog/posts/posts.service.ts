import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { CreatePostDto } from '@src/modules/blog/posts/dto/create-post.dto';
import { UpdatePostDto } from '@src/modules/blog/posts/dto/update-post.dto';
import { ListPostsDto } from '@src/modules/blog/posts/dto/list-posts.dto';
import { PostBaseDto } from '@src/modules/blog/posts/dto/post-base.dto';
import { DynamoDbService } from '@src/services/dynamoDb.service';

@Injectable()
export class PostsService {
  private readonly tableName = process.env.DYNAMO_TABLE_NAME_POSTS;

  constructor(private readonly dynamoDb: DynamoDbService) { }

  async create(createPostDto: CreatePostDto): Promise<PostBaseDto> {
    const post: PostBaseDto = {
      ...createPostDto,
      postId: Date.now(),
      postDate: new Date().toISOString(),
      postLastUpdated: new Date().toISOString(),
      postStatus: 'draft',   // Defina o status padrão desejado
      seo: {},               // Defina um objeto SEO padrão, se necessário
      viewsCount: 0,         // Inicialize com zero visualizações
    };

    await this.dynamoDb.putItem({
      TableName: this.tableName,
      Item: post,
      ConditionExpression: 'attribute_not_exists(postId)',
    });

    return post;
  }

  async findAll(query: { limit?: string; lastKey?: string }): Promise<ListPostsDto> {
    const limit = Math.min(Number(query.limit) || 20, 100);
    const ExclusiveStartKey = this.decodeCursor(query.lastKey);

    const result = await this.dynamoDb.scanItems({
      TableName: this.tableName,
      Limit: limit,
      ExclusiveStartKey,
      ConsistentRead: false,
    });

    return this.formatPaginatedResult(result.Items ?? [], result.LastEvaluatedKey);
  }

  async findOne(id: string) {
    // Caso necessário, você pode fazer um cast para um tipo que possua a propriedade Item
    const result = await this.dynamoDb.getItem({
      TableName: this.tableName,
      Key: { postId: id },
      ConsistentRead: true,
    });

    if (!result.Item) {
      throw new NotFoundException('Post não encontrado');
    }

    return result.Item;
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    const updateParams = this.dynamoDb.buildUpdateExpression(updatePostDto, ['postId']);

    if (!updateParams || !updateParams.UpdateExpression) {
      throw new BadRequestException('Nenhum campo válido para atualização');
    }

    // Realiza a atualização, concatenando a atualização do campo postLastUpdated
    const result = await this.dynamoDb.updateItem({
      TableName: this.tableName,
      Key: { postId: id },
      ...updateParams,
      UpdateExpression: `${updateParams.UpdateExpression}, postLastUpdated = :updatedAt`,
      ExpressionAttributeValues: {
        ...updateParams.ExpressionAttributeValues,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(postId)',
    });

    return result.Attributes;
  }

  async remove(id: string) {
    await this.dynamoDb.deleteItem({
      TableName: this.tableName,
      Key: { postId: id },
      ConditionExpression: 'attribute_exists(postId)',
    });

    return { success: true, message: 'Post excluído com sucesso' };
  }

  private generatePostId(): string {
    return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
  }

  private decodeCursor(cursor?: string): any | undefined {
    try {
      return cursor ? JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) : undefined;
    } catch {
      return undefined;
    }
  }

  private formatPaginatedResult(items: any[], lastKey?: any): ListPostsDto {
    return {
      data: items,
      meta: {
        count: items.length,
        nextCursor: lastKey
          ? Buffer.from(JSON.stringify(lastKey)).toString('base64')
          : null,
      },
    };
  }
}

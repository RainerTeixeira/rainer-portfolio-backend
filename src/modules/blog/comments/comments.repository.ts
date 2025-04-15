import { Injectable } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CommentEntity } from '../entities/comment.entity';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

@Injectable()
export class CommentsRepository {
  private readonly tableName = 'YourTableName';

  constructor(private readonly dynamoDb: DynamoDbService) { }

  /**
   * Busca comentários por post usando GSI
   * @param postId ID do post
   * @returns Comentários ordenados por data decrescente
   */
  async findByPost(postId: string): Promise<CommentEntity[]> {
    const result = await this.dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'GSI_PostComments',
      KeyConditionExpression: '#post = :post',
      ExpressionAttributeNames: { '#post': 'post_id' },
      ExpressionAttributeValues: { ':post': { S: postId } },
      ScanIndexForward: false
    });

    return result.Items?.map(item => this.mapDynamoItem(item)) || [];
  }

  /**
   * Busca comentários por usuário usando GSI
   * @param userId ID do usuário
   * @returns Comentários ordenados por data decrescente
   */
  async findByUser(userId: string): Promise<CommentEntity[]> {
    const result = await this.dynamoDb.query({
      TableName: this.tableName,
      IndexName: 'GSI_UserComments',
      KeyConditionExpression: '#user = :user',
      ExpressionAttributeNames: { '#user': 'user_id' },
      ExpressionAttributeValues: { ':user': { S: userId } },
      ScanIndexForward: false
    });

    return result.Items?.map(item => this.mapDynamoItem(item)) || [];
  }

  /**
   * Mapeia item DynamoDB para entidade
   */
  mapDynamoItem(item: Record<string, AttributeValue>): CommentEntity {
    return new CommentEntity({
      id: item.id.S,
      post_id: item.post_id.S,
      user_id: item.user_id.S,
      text: item.text.S,
      status: item.status.S,
      created_at: item.created_at.S,
      parent_comment_id: item.parent_comment_id?.S
    });
  }
}
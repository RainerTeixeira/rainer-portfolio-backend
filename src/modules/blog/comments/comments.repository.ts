// comments.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CommentEntity } from './comments.entity'; // Nome do arquivo corrigido (plural)
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentRepository {
  private readonly TABLE_NAME = 'Comments';

  constructor(private readonly dynamoDbService: DynamoDbService) { }

  async create(createDto: CreateCommentDto): Promise<CommentEntity> {
    const comment = new CommentEntity(createDto);
    const params = {
      TableName: this.TABLE_NAME,
      Item: comment,
    };
    await this.dynamoDbService.put(params);
    return comment;
  }

  async findById(postId: string, timestamp: string): Promise<CommentEntity> {
    const params = {
      TableName: this.TABLE_NAME,
      Key: { 'COMMENT#postId': postId, TIMESTAMP: timestamp },
    };
    const result = await this.dynamoDbService.get(params);
    if (!result?.data?.Item) {
      throw new NotFoundException(`Comment with postId ${postId} and timestamp ${timestamp} not found`);
    }
    return new CommentEntity(result.data.Item);
  }

  async update(postId: string, timestamp: string, updateDto: UpdateCommentDto): Promise<CommentEntity> {
    const existing = await this.findById(postId, timestamp);
    const updated = { ...existing, ...updateDto };
    const params = {
      TableName: this.TABLE_NAME,
      Item: updated,
    };
    await this.dynamoDbService.put(params);
    return new CommentEntity(updated);
  }

  async delete(postId: string, timestamp: string): Promise<void> {
    const params = {
      TableName: this.TABLE_NAME,
      Key: { 'COMMENT#postId': postId, TIMESTAMP: timestamp },
    };
    await this.dynamoDbService.delete(params);
  }

  async findCommentsByPost(postId: string): Promise<CommentEntity[]> {
    const params = {
      TableName: this.TABLE_NAME,
      IndexName: 'GSI_PostComments',
      KeyConditionExpression: 'post_id = :postId',
      ExpressionAttributeValues: {
        ':postId': postId,
      },
      ScanIndexForward: true,
    };
    const result = await this.dynamoDbService.query(params);
    // Corrigido: Trata 'Items' como opcional e fornece fallback
    return result.data.Items?.map((item: Record<string, unknown>) => new CommentEntity(item)) ?? [];
  }

  async findCommentsByUser(userId: string): Promise<CommentEntity[]> {
    const params = {
      TableName: this.TABLE_NAME,
      IndexName: 'GSI_UserComments',
      KeyConditionExpression: 'user_id = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: true,
    };
    const result = await this.dynamoDbService.query(params);
    // Corrigido: Trata 'Items' como opcional e fornece fallback
    return result.data.Items?.map((item: any) => new CommentEntity(item)) ?? [];
  }
}
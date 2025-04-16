import { Injectable, NotFoundException } from '@nestjs/common';
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { CommentEntity } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentRepository {
  private readonly TABLE_NAME = 'blog-table';

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

  // Consulta por GSI_PostComments (comentários de um post)
  async findCommentsByPost(postId: string): Promise<CommentEntity[]> {
    const params = {
      TableName: this.TABLE_NAME,
      IndexName: 'GSI_PostComments',
      KeyConditionExpression: 'gsiPostId = :postId',
      ExpressionAttributeValues: {
        ':postId': postId,
      },
      ScanIndexForward: true, // ordem cronológica
    };
    const result = await this.dynamoDbService.query(params);
    return result.data.Items.map((item: any) => new CommentEntity(item));
  }

  // Consulta por GSI_UserComments (comentários de um usuário)
  async findCommentsByUser(userId: string): Promise<CommentEntity[]> {
    const params = {
      TableName: this.TABLE_NAME,
      IndexName: 'GSI_UserComments',
      KeyConditionExpression: 'gsiUserId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      ScanIndexForward: true,
    };
    const result = await this.dynamoDbService.query(params);
    return result.data.Items.map((item: any) => new CommentEntity(item));
  }
}

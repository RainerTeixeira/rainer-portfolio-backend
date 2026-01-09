import { Injectable } from '@nestjs/common';
import { Comment, CommentRepository } from '../interfaces/comment-repository.interface';
import { DynamoDBService } from './dynamodb.service';
import { BaseDynamoDBRepository } from './base-dynamodb.repository';

@Injectable()
export class DynamoCommentRepository extends BaseDynamoDBRepository implements CommentRepository {
  
  constructor(dynamo: DynamoDBService) {
    super(dynamo.getDocumentClient()!, dynamo.getTableName());
  }

  async create(data: Omit<Comment, 'createdAt' | 'updatedAt'>): Promise<Comment> {
    const now = new Date();
    const comment: Comment = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    // Gerar ID único para o comentário
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    (comment as any).id = commentId;

    // PK/SK Pattern: POST#postId / COMMENT#commentId
    const PK = this.createEntityPK('POST', comment.postId);
    const SK = this.createEntitySK('COMMENT', commentId);
    
    const dynamoItem = this.toDynamoDB(comment, 'COMMENT', PK, SK);
    
    // Adicionar GSI1 para queries globais de comentários
    dynamoItem.GSI1PK = this.createGSI1PK('ENTITY', 'COMMENT');
    dynamoItem.GSI1SK = this.createGSI1SK('COMMENT', commentId, comment.createdAt.toISOString());
    
    // Adicionar GSI2 para queries por autor
    dynamoItem.GSI2PK = this.createGSI2PK('AUTHOR', comment.authorId);
    dynamoItem.GSI2SK = this.createGSI2SK('COMMENT', commentId, comment.createdAt.toISOString());
    
    await this.putItem(dynamoItem);

    return comment;
  }

  async findById(id: string): Promise<Comment | null> {
    // Buscar por GSI1 usando commentId
    const result = await this.query({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)',
      ExpressionAttributeValues: {
        ':gsi1pk': this.createGSI1PK('ENTITY', 'COMMENT'),
        ':gsi1sk': this.createGSI1SK('COMMENT', id),
      },
    });

    const comment = result.items[0];
    return comment ? this.fromDynamoDB(comment) as Comment : null;
  }

  async findByPostId(postId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    // Query por post: PK = POST#postId, SK begins_with COMMENT#
    const result = await this.query({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': this.createEntityPK('POST', postId),
        ':sk': 'COMMENT#',
      },
      Limit: options.limit,
      ScanIndexForward: true, // Ordenar por createdAt (ASC)
    });

    let comments = result.items.map(item => this.fromDynamoDB(item) as Comment);

    // Aplicar offset
    if (options.offset) {
      comments = comments.slice(options.offset);
    }

    return comments;
  }

  async findByAuthorId(authorId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Comment[]> {
    // Query por autor usando GSI2
    const result = await this.query({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk AND begins_with(GSI2SK, :gsi2sk)',
      ExpressionAttributeValues: {
        ':gsi2pk': this.createGSI2PK('AUTHOR', authorId),
        ':gsi2sk': 'COMMENT#',
      },
      Limit: options.limit,
      ScanIndexForward: false, // Mais recentes primeiro
    });

    let comments = result.items.map(item => this.fromDynamoDB(item) as Comment);

    // Aplicar offset
    if (options.offset) {
      comments = comments.slice(options.offset);
    }

    return comments;
  }

  async findReplies(parentId: string): Promise<Comment[]> {
    // Buscar comentários com parentId específico
    const result = await this.scan({
      FilterExpression: 'parentId = :parentId AND entityType = :entityType',
      ExpressionAttributeValues: {
        ':parentId': parentId,
        ':entityType': 'COMMENT',
      },
    });

    return result.items.map(item => this.fromDynamoDB(item) as Comment);
  }

  async update(id: string, data: Partial<Comment>): Promise<Comment | null> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Comment not found');

    const updated: Comment = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };

    // PK/SK Pattern: POST#postId / COMMENT#commentId
    const PK = this.createEntityPK('POST', updated.postId);
    const SK = this.createEntitySK('COMMENT', id);
    
    const dynamoItem = this.toDynamoDB(updated, 'COMMENT', PK, SK);
    
    // Recriar GSI1
    dynamoItem.GSI1PK = this.createGSI1PK('ENTITY', 'COMMENT');
    dynamoItem.GSI1SK = this.createGSI1SK('COMMENT', id, updated.createdAt.toISOString());
    
    // Recriar GSI2
    dynamoItem.GSI2PK = this.createGSI2PK('AUTHOR', updated.authorId);
    dynamoItem.GSI2SK = this.createGSI2SK('COMMENT', id, updated.createdAt.toISOString());
    
    await this.putItem(dynamoItem);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const comment = await this.findById(id);
    if (!comment) return;

    const PK = this.createEntityPK('POST', comment.postId);
    const SK = this.createEntitySK('COMMENT', id);
    
    await this.deleteItem({ PK, SK });
  }

  async approve(id: string): Promise<void> {
    await this.update(id, { isApproved: true } as any);
  }

  async reject(id: string): Promise<void> {
    await this.update(id, { isApproved: false } as any);
  }
}
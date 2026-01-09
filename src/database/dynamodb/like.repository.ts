import { Injectable } from '@nestjs/common';
import { Like, LikeRepository } from '../interfaces/like-repository.interface';
import { DynamoDBService } from './dynamodb.service';
import { BaseDynamoDBRepository } from './base-dynamodb.repository';

@Injectable()
export class DynamoLikeRepository extends BaseDynamoDBRepository implements LikeRepository {
  
  constructor(dynamo: DynamoDBService) {
    super(dynamo.getDocumentClient()!, dynamo.getTableName());
  }

  async create(data: Omit<Like, 'createdAt'>): Promise<Like> {
    const now = new Date();
    const like: Like = {
      ...data,
      createdAt: now,
    };

    // Gerar ID único para o like
    const likeId = `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    (like as any).id = likeId;

    // PK/SK Pattern: POST#postId / LIKE#userId (chave composta)
    const PK = this.createEntityPK('POST', like.postId);
    const SK = this.createEntitySK('LIKE', like.userId);
    
    const dynamoItem = this.toDynamoDB(like, 'LIKE', PK, SK);
    
    // Adicionar GSI1 para queries globais de likes
    dynamoItem.GSI1PK = this.createGSI1PK('ENTITY', 'LIKE');
    dynamoItem.GSI1SK = this.createGSI1SK('LIKE', likeId, like.createdAt.toISOString());
    
    // Adicionar GSI2 para queries por usuário
    dynamoItem.GSI2PK = this.createGSI2PK('USER', like.userId);
    dynamoItem.GSI2SK = this.createGSI2SK('LIKE', like.postId, like.createdAt.toISOString());
    
    await this.putItem(dynamoItem);

    return like;
  }

  async findById(id: string): Promise<Like | null> {
    // Buscar por GSI1 usando likeId
    const result = await this.query({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)',
      ExpressionAttributeValues: {
        ':gsi1pk': this.createGSI1PK('ENTITY', 'LIKE'),
        ':gsi1sk': this.createGSI1SK('LIKE', id),
      },
    });

    const like = result.items[0];
    return like ? this.fromDynamoDB(like) as Like : null;
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Like | null> {
    // Query direta por PK/SK (mais eficiente)
    const PK = this.createEntityPK('POST', postId);
    const SK = this.createEntitySK('LIKE', userId);
    
    const item = await this.getItem({ PK, SK });
    return item ? this.fromDynamoDB(item) as Like : null;
  }

  async findByPost(postId: string): Promise<Like[]> {
    // Query por post: PK = POST#postId, SK begins_with LIKE#
    const result = await this.query({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': this.createEntityPK('POST', postId),
        ':sk': 'LIKE#',
      },
      ScanIndexForward: false, // Mais recentes primeiro
    });

    return result.items.map(item => this.fromDynamoDB(item) as Like);
  }

  async findByUser(userId: string): Promise<Like[]> {
    // Query por usuário usando GSI2
    const result = await this.query({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk AND begins_with(GSI2SK, :gsi2sk)',
      ExpressionAttributeValues: {
        ':gsi2pk': this.createGSI2PK('USER', userId),
        ':gsi2sk': 'LIKE#',
      },
      ScanIndexForward: false, // Mais recentes primeiro
    });

    return result.items.map(item => this.fromDynamoDB(item) as Like);
  }

  async delete(id: string): Promise<void> {
    const like = await this.findById(id);
    if (!like) return;

    const PK = this.createEntityPK('POST', like.postId);
    const SK = this.createEntitySK('LIKE', like.userId);
    
    await this.deleteItem({ PK, SK });
  }

  async deleteByUserAndPost(userId: string, postId: string): Promise<void> {
    // Query direta por PK/SK (mais eficiente)
    const PK = this.createEntityPK('POST', postId);
    const SK = this.createEntitySK('LIKE', userId);
    
    await this.deleteItem({ PK, SK });
  }

  async findByUserAndComment(userId: string, commentId: string): Promise<Like | null> {
    // Para likes em comentários, usar scan (em produção criar GSI dedicada)
    const result = await this.scan({
      FilterExpression: 'userId = :userId AND commentId = :commentId AND entityType = :entityType',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':commentId': commentId,
        ':entityType': 'LIKE',
      },
    });

    const like = result.items[0];
    return like ? this.fromDynamoDB(like) as Like : null;
  }

  async findByComment(commentId: string): Promise<Like[]> {
    // Para likes em comentários, usar scan (em produção criar GSI dedicada)
    const result = await this.scan({
      FilterExpression: 'commentId = :commentId AND entityType = :entityType',
      ExpressionAttributeValues: {
        ':commentId': commentId,
        ':entityType': 'LIKE',
      },
    });

    return result.items.map(item => this.fromDynamoDB(item) as Like);
  }

  async deleteByUserAndComment(userId: string, commentId: string): Promise<void> {
    // Para likes em comentários, usar scan (em produção criar GSI dedicada)
    const result = await this.scan({
      FilterExpression: 'userId = :userId AND commentId = :commentId AND entityType = :entityType',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':commentId': commentId,
        ':entityType': 'LIKE',
      },
    });

    if (result.items.length > 0) {
      const like = this.fromDynamoDB(result.items[0]) as Like;
      await this.delete(like.id);
    }
  }
}
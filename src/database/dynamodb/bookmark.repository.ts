import { Injectable } from '@nestjs/common';
import { Bookmark, BookmarkRepository } from '../interfaces/bookmark-repository.interface';
import { DynamoDBService } from './dynamodb.service';
import { BaseDynamoDBRepository } from './base-dynamodb.repository';

@Injectable()
export class DynamoBookmarkRepository extends BaseDynamoDBRepository implements BookmarkRepository {
  
  constructor(dynamo: DynamoDBService) {
    super(dynamo.getDocumentClient()!, dynamo.getTableName());
  }

  async create(data: Omit<Bookmark, 'createdAt'>): Promise<Bookmark> {
    const now = new Date();
    const bookmark: Bookmark = {
      ...data,
      createdAt: now,
    };

    // Gerar ID único para o bookmark
    const bookmarkId = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    (bookmark as any).id = bookmarkId;

    // PK/SK Pattern: USER#userId / BOOKMARK#postId (chave composta)
    const PK = this.createEntityPK('USER', bookmark.userId);
    const SK = this.createEntitySK('BOOKMARK', bookmark.postId);
    
    const dynamoItem = this.toDynamoDB(bookmark, 'BOOKMARK', PK, SK);
    
    // Adicionar GSI1 para queries globais de bookmarks
    dynamoItem.GSI1PK = this.createGSI1PK('ENTITY', 'BOOKMARK');
    dynamoItem.GSI1SK = this.createGSI1SK('BOOKMARK', bookmarkId, bookmark.createdAt.toISOString());
    
    // Adicionar GSI2 para queries por post
    dynamoItem.GSI2PK = this.createGSI2PK('POST', bookmark.postId);
    dynamoItem.GSI2SK = this.createGSI2SK('USER', bookmark.userId, bookmark.createdAt.toISOString());
    
    await this.putItem(dynamoItem);

    return bookmark;
  }

  async findById(id: string): Promise<Bookmark | null> {
    // Buscar por GSI1 usando bookmarkId
    const result = await this.query({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)',
      ExpressionAttributeValues: {
        ':gsi1pk': this.createGSI1PK('ENTITY', 'BOOKMARK'),
        ':gsi1sk': this.createGSI1SK('BOOKMARK', id),
      },
    });

    const bookmark = result.items[0];
    return bookmark ? this.fromDynamoDB(bookmark) as Bookmark : null;
  }

  async findByUserAndPost(userId: string, postId: string): Promise<Bookmark | null> {
    // Query direta por PK/SK (mais eficiente)
    const PK = this.createEntityPK('USER', userId);
    const SK = this.createEntitySK('BOOKMARK', postId);
    
    const item = await this.getItem({ PK, SK });
    return item ? this.fromDynamoDB(item) as Bookmark : null;
  }

  async findByPost(postId: string): Promise<Bookmark[]> {
    // Query por post usando GSI2
    const result = await this.query({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk AND begins_with(GSI2SK, :gsi2sk)',
      ExpressionAttributeValues: {
        ':gsi2pk': this.createGSI2PK('POST', postId),
        ':gsi2sk': 'USER#',
      },
      ScanIndexForward: false, // Mais recentes primeiro
    });

    return result.items.map(item => this.fromDynamoDB(item) as Bookmark);
  }

  async findByUser(userId: string, options: {
    limit?: number;
    offset?: number;
  } = {}): Promise<Bookmark[]> {
    // Query por usuário: PK = USER#userId, SK begins_with BOOKMARK#
    const result = await this.query({
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': this.createEntityPK('USER', userId),
        ':sk': 'BOOKMARK#',
      },
      Limit: options.limit,
      ScanIndexForward: false, // Mais recentes primeiro
    });

    let bookmarks = result.items.map(item => this.fromDynamoDB(item) as Bookmark);

    // Aplicar offset
    if (options.offset) {
      bookmarks = bookmarks.slice(options.offset);
    }

    return bookmarks;
  }

  async delete(id: string): Promise<void> {
    const bookmark = await this.findById(id);
    if (!bookmark) return;

    const PK = this.createEntityPK('USER', bookmark.userId);
    const SK = this.createEntitySK('BOOKMARK', bookmark.postId);
    
    await this.deleteItem({ PK, SK });
  }

  async deleteByUserAndPost(userId: string, postId: string): Promise<void> {
    // Query direta por PK/SK (mais eficiente)
    const PK = this.createEntityPK('USER', userId);
    const SK = this.createEntitySK('BOOKMARK', postId);
    
    await this.deleteItem({ PK, SK });
  }

  async findByUserAndComment(userId: string, commentId: string): Promise<Bookmark | null> {
    // Para bookmarks em comentários, usar scan (em produção criar GSI dedicada)
    const result = await this.scan({
      FilterExpression: 'userId = :userId AND commentId = :commentId AND entityType = :entityType',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':commentId': commentId,
        ':entityType': 'BOOKMARK',
      },
    });

    const bookmark = result.items[0];
    return bookmark ? this.fromDynamoDB(bookmark) as Bookmark : null;
  }

  async findByComment(commentId: string): Promise<Bookmark[]> {
    // Para bookmarks em comentários, usar scan (em produção criar GSI dedicada)
    const result = await this.scan({
      FilterExpression: 'commentId = :commentId AND entityType = :entityType',
      ExpressionAttributeValues: {
        ':commentId': commentId,
        ':entityType': 'BOOKMARK',
      },
    });

    return result.items.map(item => this.fromDynamoDB(item) as Bookmark);
  }

  async deleteByUserAndComment(userId: string, commentId: string): Promise<void> {
    // Para bookmarks em comentários, usar scan (em produção criar GSI dedicada)
    const result = await this.scan({
      FilterExpression: 'userId = :userId AND commentId = :commentId AND entityType = :entityType',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':commentId': commentId,
        ':entityType': 'BOOKMARK',
      },
    });

    if (result.items.length > 0) {
      const bookmark = this.fromDynamoDB(result.items[0]) as Bookmark;
      await this.delete(bookmark.id);
    }
  }
}
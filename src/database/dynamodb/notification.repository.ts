import { Injectable } from '@nestjs/common';
import { Notification, NotificationRepository } from '../interfaces/notification-repository.interface';
import { DynamoDBService } from './dynamodb.service';
import { BaseDynamoDBRepository } from './base-dynamodb.repository';

@Injectable()
export class DynamoNotificationRepository extends BaseDynamoDBRepository implements NotificationRepository {
  
  constructor(dynamo: DynamoDBService) {
    super(dynamo.getDocumentClient()!, dynamo.getTableName());
  }

  async create(data: Omit<Notification, 'createdAt' | 'readAt'>): Promise<Notification> {
    const now = new Date();
    const notification: Notification = {
      ...data,
      createdAt: now,
      readAt: data.isRead ? now : undefined,
    };

    // Gerar ID único para a notificação
    const notificationId = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    (notification as any).id = notificationId;

    // PK/SK Pattern: USER#userId / NOTIFICATION#notificationId
    const PK = this.createEntityPK('USER', notification.userId);
    const SK = this.createEntitySK('NOTIFICATION', notificationId);
    
    const dynamoItem = this.toDynamoDB(notification, 'NOTIFICATION', PK, SK);
    
    // Adicionar GSI1 para queries globais de notificações
    dynamoItem.GSI1PK = this.createGSI1PK('ENTITY', 'NOTIFICATION');
    dynamoItem.GSI1SK = this.createGSI1SK('NOTIFICATION', notificationId, notification.createdAt.toISOString());
    
    // Adicionar GSI2 para queries por status (lidas/não lidas)
    const statusPrefix = notification.isRead ? 'READ' : 'UNREAD';
    dynamoItem.GSI2PK = this.createGSI2PK('STATUS', statusPrefix);
    dynamoItem.GSI2SK = this.createGSI2SK('USER', notification.userId, notification.createdAt.toISOString());
    
    await this.putItem(dynamoItem);

    return notification;
  }

  async findById(id: string): Promise<Notification | null> {
    // Buscar por GSI1 usando notificationId
    const result = await this.query({
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :gsi1sk)',
      ExpressionAttributeValues: {
        ':gsi1pk': this.createGSI1PK('ENTITY', 'NOTIFICATION'),
        ':gsi1sk': this.createGSI1SK('NOTIFICATION', id),
      },
    });

    const notification = result.items[0];
    return notification ? this.fromDynamoDB(notification) as Notification : null;
  }

  async findByUser(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}): Promise<Notification[]> {
    let result: { items: any[]; lastEvaluatedKey?: any };

    if (options.unreadOnly) {
      // Query por usuário não lidas usando GSI2
      result = await this.query({
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :gsi2pk AND begins_with(GSI2SK, :gsi2sk)',
        ExpressionAttributeValues: {
          ':gsi2pk': this.createGSI2PK('STATUS', 'UNREAD'),
          ':gsi2sk': this.createGSI2SK('USER', userId),
        },
        Limit: options.limit,
        ScanIndexForward: false, // Mais recentes primeiro
      });
    } else {
      // Query por usuário: PK = USER#userId, SK begins_with NOTIFICATION#
      result = await this.query({
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': this.createEntityPK('USER', userId),
          ':sk': 'NOTIFICATION#',
        },
        Limit: options.limit,
        ScanIndexForward: false, // Mais recentes primeiro
      });
    }

    let notifications = result.items.map(item => this.fromDynamoDB(item) as Notification);

    // Aplicar offset
    if (options.offset) {
      notifications = notifications.slice(options.offset);
    }

    return notifications;
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification | null> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Notification not found');

    const updated: Notification = {
      ...existing,
      ...data,
    };

    // Se mudou o status de leitura, atualizar readAt
    if (data.isRead !== undefined && data.isRead !== existing.isRead) {
      updated.readAt = data.isRead ? new Date() : undefined;
    }

    // PK/SK Pattern: USER#userId / NOTIFICATION#notificationId
    const PK = this.createEntityPK('USER', updated.userId);
    const SK = this.createEntitySK('NOTIFICATION', id);
    
    const dynamoItem = this.toDynamoDB(updated, 'NOTIFICATION', PK, SK);
    
    // Recriar GSI1
    dynamoItem.GSI1PK = this.createGSI1PK('ENTITY', 'NOTIFICATION');
    dynamoItem.GSI1SK = this.createGSI1SK('NOTIFICATION', id, updated.createdAt.toISOString());
    
    // Recriar GSI2 com status atualizado
    const statusPrefix = updated.isRead ? 'READ' : 'UNREAD';
    dynamoItem.GSI2PK = this.createGSI2PK('STATUS', statusPrefix);
    dynamoItem.GSI2SK = this.createGSI2SK('USER', updated.userId, updated.createdAt.toISOString());
    
    await this.putItem(dynamoItem);

    return updated;
  }

  async markAsRead(id: string): Promise<Notification | null> {
    return await this.update(id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.findByUser(userId, { unreadOnly: true });
    
    // Atualizar em lote para melhor performance
    for (const notification of notifications) {
      await this.markAsRead(notification.id);
    }
  }

  async delete(id: string): Promise<void> {
    const notification = await this.findById(id);
    if (!notification) return;

    const PK = this.createEntityPK('USER', notification.userId);
    const SK = this.createEntitySK('NOTIFICATION', id);
    
    await this.deleteItem({ PK, SK });
  }

  async deleteAll(userId: string): Promise<void> {
    const notifications = await this.findByUser(userId);
    
    // Deletar em lote para melhor performance
    for (const notification of notifications) {
      await this.delete(notification.id);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Query eficiente usando GSI2
    const result = await this.query({
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk AND begins_with(GSI2SK, :gsi2sk)',
      ExpressionAttributeValues: {
        ':gsi2pk': this.createGSI2PK('STATUS', 'UNREAD'),
        ':gsi2sk': this.createGSI2SK('USER', userId),
      },
    });

    return result.items.length;
  }
}

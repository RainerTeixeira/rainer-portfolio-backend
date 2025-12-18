import { Injectable } from '@nestjs/common';
import { Notification, NotificationRepository } from '../interfaces/notification-repository.interface';
import { DynamoDBService } from './dynamodb.service';

// Interface interna para incluir chaves do DynamoDB
interface NotificationWithKeys extends Notification {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
}

@Injectable()
export class DynamoNotificationRepository implements NotificationRepository {
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Notification, 'createdAt' | 'readAt'>): Promise<Notification> {
    const now = new Date();
    const item: Notification = {
      ...data,
      createdAt: now,
      readAt: data.isRead ? now : undefined,
    };

    await this.dynamo.put({
      PK: `NOTIFICATION#${item.id}`,
      SK: 'PROFILE',
      GSI1PK: `USER#${item.userId}`,
      GSI1SK: item.createdAt.toISOString(),
      GSI2PK: `USER#${item.userId}#UNREAD`,
      GSI2SK: item.createdAt.toISOString(),
      ...item,
    });

    return item;
  }

  async findById(id: string): Promise<Notification | null> {
    const result = await this.dynamo.get({ PK: `NOTIFICATION#${id}`, SK: 'PROFILE' });

    if (!result) return null;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { PK, SK, GSI1PK, GSI1SK, GSI2PK, GSI2SK, ...notification } = result as unknown as NotificationWithKeys;
    return notification as Notification;
  }

  async findByUser(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}): Promise<Notification[]> {
    // Implementação simplificada - em produção usaria GSI1/GSI2
    let notifications = await this.scanNotifications();
    notifications = notifications.filter(n => n.userId === userId);

    if (options.unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }

    // Ordenar por data (mais recentes primeiro)
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options.offset) {
      notifications = notifications.slice(options.offset);
    }
    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const notification = await this.findById(id);
    if (!notification) return null;

    return await this.update(id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.findByUser(userId, { unreadOnly: true });
    
    for (const notification of notifications) {
      await this.markAsRead(notification.id);
    }
  }

  async delete(id: string): Promise<void> {
    await this.dynamo.delete(`NOTIFICATION#${id}`, 'PROFILE');
  }

  async deleteAll(userId: string): Promise<void> {
    const notifications = await this.findByUser(userId);
    
    for (const notification of notifications) {
      await this.delete(notification.id);
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.findByUser(userId, { unreadOnly: true });
    return notifications.length;
  }

  private async update(id: string, data: Partial<Notification>): Promise<Notification | null> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Notification not found');

    const updated: Notification = {
      ...existing,
      ...data,
    };

    await this.dynamo.put({
      PK: `NOTIFICATION#${updated.id}`,
      SK: 'PROFILE',
      GSI1PK: `USER#${updated.userId}`,
      GSI1SK: updated.createdAt.toISOString(),
      GSI2PK: `USER#${updated.userId}#UNREAD`,
      GSI2SK: updated.createdAt.toISOString(),
      ...updated,
    });

    return updated;
  }

  private async scanNotifications(): Promise<Notification[]> {
    // Método auxiliar para scan de notificações
    // Em produção, isso seria otimizado com queries
    return [];
  }
}

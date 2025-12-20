import { Injectable } from '@nestjs/common';
import { Notification, NotificationRepository } from '../interfaces/notification-repository.interface';
import { DynamoDBService } from './dynamodb.service';

@Injectable()
export class DynamoNotificationRepository implements NotificationRepository {
  private readonly tableName = 'portfolio-backend-table-notifications';
  
  constructor(private readonly dynamo: DynamoDBService) {}

  async create(data: Omit<Notification, 'createdAt' | 'readAt'>): Promise<Notification> {
    const now = new Date();
    const item: Notification = {
      ...data,
      createdAt: now,
      readAt: data.isRead ? now : undefined,
    };

    await this.dynamo.put(item, this.tableName);
    return item;
  }

  async findById(id: string): Promise<Notification | null> {
    const result = await this.dynamo.get({ id }, this.tableName);
    if (!result) return null;
    return result as Notification;
  }

  async findByUser(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}): Promise<Notification[]> {
    let notifications = await this.findAll();
    notifications = notifications.filter(n => n.userId === userId);

    if (options.unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }

    // Sort by date (most recent first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options.offset) {
      notifications = notifications.slice(options.offset);
    }
    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
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

    await this.dynamo.put(updated, this.tableName);
    return updated;
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
    const notification = await this.findById(id);
    if (notification) {
      await this.dynamo.delete(id, '', this.tableName);
    }
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

  private async findAll(): Promise<Notification[]> {
    try {
      const items = await this.dynamo.scan({}, this.tableName);
      return items as unknown as Notification[];
    } catch (error) {
      // Error scanning notifications
      return [];
    }
  }
}
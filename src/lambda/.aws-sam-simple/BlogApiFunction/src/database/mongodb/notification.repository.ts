import { Injectable } from '@nestjs/common';
import { Notification, NotificationRepository } from '../interfaces/notification-repository.interface';
import { MongoDBService } from './mongodb.service';
import { Collection, Filter, UpdateFilter } from 'mongodb';

@Injectable()
export class MongoNotificationRepository implements NotificationRepository {
  private collection: Collection<Notification>;

  constructor(private readonly mongo: MongoDBService) {}

  private getCollection(): Collection<Notification> {
    if (!this.collection) {
      this.collection = this.mongo.getCollection<Notification>('notifications');
    }
    return this.collection;
  }

  async create(data: Omit<Notification, 'createdAt' | 'readAt'>): Promise<Notification> {
    const notification: Notification = {
      ...data,
      createdAt: new Date(),
      readAt: undefined,
    };

    await this.getCollection().insertOne(notification);
    return notification;
  }

  async findById(id: string): Promise<Notification | null> {
    return await this.getCollection().findOne({ id });
  }

  async findByUser(userId: string, options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}): Promise<Notification[]> {
    const filter: Filter<Notification> = { userId };

    if (options.unreadOnly) {
      filter.readAt = { $exists: false };
    }

    const cursor = this.getCollection().find(filter)
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async findAll(options: {
    userId?: string;
    type?: string;
    read?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Notification[]> {
    const filter: Filter<Notification> = {};

    if (options.userId) {
      filter.userId = options.userId;
    }
    if (options.type) {
      filter.type = options.type as any;
    }
    if (options.read !== undefined) {
      filter.readAt = options.read ? { $exists: true } : { $exists: false };
    }

    const cursor = this.getCollection().find(filter)
      .sort({ createdAt: -1 });

    if (options.offset) {
      cursor.skip(options.offset);
    }

    if (options.limit) {
      cursor.limit(options.limit);
    }

    return await cursor.toArray();
  }

  async markAsRead(id: string): Promise<Notification | null> {
    const updateDoc: UpdateFilter<Notification> = {
      $set: {
        readAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const result = await this.getCollection().findOneAndUpdate(
      { id },
      updateDoc,
      { returnDocument: 'after' }
    );

    return result || null;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.getCollection().updateMany(
      { userId, readAt: { $exists: false } },
      { $set: { readAt: new Date(), updatedAt: new Date() } }
    );
  }

  async delete(id: string): Promise<void> {
    await this.getCollection().deleteOne({ id });
  }

  async deleteByUser(userId: string): Promise<void> {
    await this.getCollection().deleteMany({ userId });
  }

  async countUnread(userId: string): Promise<number> {
    return await this.getCollection().countDocuments({
      userId,
      readAt: undefined,
    });
  }

  async countByUser(userId: string): Promise<number> {
    return await this.getCollection().countDocuments({ userId });
  }

  async deleteAll(userId: string): Promise<void> {
    await this.getCollection().deleteMany({ userId });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.getCollection().countDocuments({
      userId,
      readAt: { $exists: false },
    });
  }
}

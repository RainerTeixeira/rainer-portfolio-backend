import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Notification, CreateNotificationData, UpdateNotificationData } from './notification.model.js';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    return await this.prisma.notification.create({ data: data as any }) as any;
  }

  async findById(id: string): Promise<Notification | null> {
    return await this.prisma.notification.findUnique({ where: { id } }) as any;
  }

  async findByUser(userId: string, params?: { unreadOnly?: boolean }): Promise<Notification[]> {
    const where: any = { userId };
    if (params?.unreadOnly) where.isRead = false;
    
    return await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async update(id: string, data: UpdateNotificationData): Promise<Notification> {
    return await this.prisma.notification.update({ where: { id }, data: data as any }) as any;
  }

  async delete(id: string): Promise<boolean> {
    await this.prisma.notification.delete({ where: { id } });
    return true;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  async countUnread(userId: string): Promise<number> {
    return await this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}


import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository.js';
import type { CreateNotificationData, UpdateNotificationData } from './notification.model.js';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async createNotification(data: CreateNotificationData) {
    return await this.notificationsRepository.create(data);
  }

  async getNotificationById(id: string) {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) throw new NotFoundException('Notificação não encontrada');
    return notification;
  }

  async getNotificationsByUser(userId: string, unreadOnly: boolean = false) {
    return await this.notificationsRepository.findByUser(userId, { unreadOnly });
  }

  async updateNotification(id: string, data: UpdateNotificationData) {
    await this.getNotificationById(id);
    return await this.notificationsRepository.update(id, data);
  }

  async deleteNotification(id: string) {
    await this.getNotificationById(id);
    await this.notificationsRepository.delete(id);
    return { success: true };
  }

  async markAsRead(id: string) {
    return await this.notificationsRepository.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string) {
    const count = await this.notificationsRepository.markAllAsRead(userId);
    return { success: true, count };
  }

  async countUnread(userId: string) {
    const count = await this.notificationsRepository.countUnread(userId);
    return { count };
  }
}


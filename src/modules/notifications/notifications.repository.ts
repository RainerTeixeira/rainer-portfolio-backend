/**
 * Repositório de Notificações
 * 
 * Camada de acesso a dados para notificações.
 * 
 * @module modules/notifications/notifications.repository
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { Notification, CreateNotificationData, UpdateNotificationData } from './notification.model.js';

/**
 * NotificationsRepository
 *
 * Camada de acesso a dados de notificações (Prisma).
 */
@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria notificação. */
  async create(data: CreateNotificationData): Promise<Notification> {
    return await this.prisma.notification.create({ data: data as any }) as any;
  }

  /** Retorna notificação por ID. */
  async findById(id: string): Promise<Notification | null> {
    return await this.prisma.notification.findUnique({ where: { id } }) as any;
  }

  /** Lista notificações de um usuário (opcionalmente apenas não lidas). */
  async findByUser(userId: string, params?: { unreadOnly?: boolean }): Promise<Notification[]> {
    const where: any = { userId };
    if (params?.unreadOnly) where.isRead = false;
    
    return await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  /** Atualiza notificação. */
  async update(id: string, data: UpdateNotificationData): Promise<Notification> {
    return await this.prisma.notification.update({ where: { id }, data: data as any }) as any;
  }

  /** Remove notificação por ID. */
  async delete(id: string): Promise<boolean> {
    await this.prisma.notification.delete({ where: { id } });
    return true;
  }

  /** Marca todas as notificações de um usuário como lidas; retorna contagem. */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  /** Conta notificações não lidas de um usuário. */
  async countUnread(userId: string): Promise<number> {
    return await this.prisma.notification.count({ where: { userId, isRead: false } });
  }
}


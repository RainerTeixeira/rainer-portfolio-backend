/**
 * Interface do repositório de notificações (contrato)
 */

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  relatedId?: string;
  relatedType?: 'POST' | 'COMMENT' | 'USER';
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationRepository {
  create(data: Omit<Notification, 'createdAt' | 'readAt'>): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUser(userId: string, options?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<Notification[]>;
  markAsRead(id: string): Promise<Notification | null>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}

export const NOTIFICATION_REPOSITORY = 'NOTIFICATION_REPOSITORY';

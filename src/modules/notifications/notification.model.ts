/**
 * Modelo de Notification
 * 
 * Define a estrutura de dados para notificações do sistema.
 * 
 * @module modules/notifications/notification.model
 */

export enum NotificationType {
  NEW_COMMENT = 'NEW_COMMENT',
  NEW_LIKE = 'NEW_LIKE',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  POST_PUBLISHED = 'POST_PUBLISHED',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  metadata?: any | null;
  isRead: boolean;
  userId: string;
  createdAt: Date;
  readAt?: Date | null;
}

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  userId: string;
}

export interface UpdateNotificationData {
  type?: NotificationType;
  title?: string;
  message?: string;
  link?: string;
  metadata?: any;
  isRead?: boolean;
}


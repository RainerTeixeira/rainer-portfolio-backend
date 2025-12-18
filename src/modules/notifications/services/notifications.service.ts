/**
 * @fileoverview Serviço de Notificações
 *
 * Serviço responsável por coordenar o ciclo de vida de notificações:
 * criação, consulta, marcação como lida e remoção.
 *
 * Também expõe métodos de conveniência (`notifyNewLike`, `notifyNewComment`,
 * `notifyNewFollower`) para cenários comuns, encapsulando a criação do payload.
 *
 * @module modules/notifications/services/notifications.service
 */

import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY } from '../../../database/tokens';
import { NotificationRepository } from '../../../database/interfaces/notification-repository.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationsRepo: NotificationRepository,
  ) {}

  /**
   * Cria uma notificação.
   *
   * Regras/decisões aplicadas aqui:
   * - Gera `id`.
   * - Define `isRead` como `false` por padrão quando não informado.
   *
   * @param {CreateNotificationDto} dto Dados da notificação.
   * @returns {Promise<unknown>} Notificação criada.
   */
  async createNotification(dto: CreateNotificationDto) {
    const id = randomUUID();

    return this.notificationsRepo.create({
      id,
      userId: dto.userId,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      isRead: dto.isRead || false,
      relatedId: dto.relatedId,
      relatedType: dto.relatedType,
      actionUrl: dto.actionUrl,
    });
  }

  /**
   * Busca uma notificação por ID.
   *
   * @param {string} id ID da notificação.
   * @returns {Promise<unknown>} Notificação encontrada.
   */
  async getNotificationById(id: string) {
    return this.notificationsRepo.findById(id);
  }

  /**
   * Lista notificações de um usuário, com suporte a paginação e filtro de não lidas.
   *
   * @param {string} userId ID do usuário.
   * @param {object} [options] Opções de listagem.
   * @returns {Promise<unknown>} Notificações encontradas.
   */
  async getUserNotifications(userId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) {
    return this.notificationsRepo.findByUser(userId, options);
  }

  /**
   * Marca uma notificação como lida.
   *
   * @param {string} id ID da notificação.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async markAsRead(id: string) {
    await this.notificationsRepo.markAsRead(id);
  }

  /**
   * Marca todas as notificações de um usuário como lidas.
   *
   * @param {string} userId ID do usuário.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async markAllAsRead(userId: string) {
    await this.notificationsRepo.markAllAsRead(userId);
  }

  /**
   * Remove uma notificação.
   *
   * @param {string} id ID da notificação.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async deleteNotification(id: string) {
    await this.notificationsRepo.delete(id);
  }

  /**
   * Remove todas as notificações de um usuário.
   *
   * @param {string} userId ID do usuário.
   * @returns {Promise<void>} Conclusão da operação.
   */
  async deleteAllNotifications(userId: string) {
    await this.notificationsRepo.deleteAll(userId);
  }

  /**
   * Retorna a contagem de notificações não lidas.
   *
   * @param {string} userId ID do usuário.
   * @returns {Promise<unknown>} Contagem.
   */
  async getUnreadCount(userId: string) {
    return this.notificationsRepo.getUnreadCount(userId);
  }

  // Métodos de conveniência para criar notificações comuns
  /**
   * Cria uma notificação para o evento de “novo like”.
   *
   * @param {string} userId Usuário que receberá a notificação.
   * @param {string} postId Post relacionado.
   * @param {string} userName Nome de quem curtiu.
   * @returns {Promise<unknown>} Notificação criada.
   */
  async notifyNewLike(userId: string, postId: string, userName: string) {
    return this.createNotification({
      userId,
      title: 'Novo like',
      message: `${userName} curtiu seu post`,
      type: 'INFO',
      relatedId: postId,
      relatedType: 'POST',
      actionUrl: `/posts/${postId}`,
    });
  }

  /**
   * Cria uma notificação para o evento de “novo comentário”.
   *
   * @param {string} userId Usuário que receberá a notificação.
   * @param {string} postId Post relacionado.
   * @param {string} _commentId ID do comentário (atualmente não utilizado no payload).
   * @param {string} userName Nome de quem comentou.
   * @returns {Promise<unknown>} Notificação criada.
   */
  async notifyNewComment(userId: string, postId: string, _commentId: string, userName: string) {
    return this.createNotification({
      userId,
      title: 'Novo comentário',
      message: `${userName} comentou no seu post`,
      type: 'INFO',
      relatedId: postId,
      relatedType: 'POST',
      actionUrl: `/posts/${postId}`,
    });
  }

  /**
   * Cria uma notificação para o evento de “novo seguidor”.
   *
   * @param {string} userId Usuário que receberá a notificação.
   * @param {string} followerId ID do seguidor.
   * @param {string} followerName Nome do seguidor.
   * @returns {Promise<unknown>} Notificação criada.
   */
  async notifyNewFollower(userId: string, followerId: string, followerName: string) {
    return this.createNotification({
      userId,
      title: 'Novo seguidor',
      message: `${followerName} começou a seguir você`,
      type: 'INFO',
      relatedId: followerId,
      relatedType: 'USER',
      actionUrl: `/users/${followerId}`,
    });
  }
}

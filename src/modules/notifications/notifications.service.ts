/**
 * Serviço de Notificações
 *
 * Camada de lógica de negócio para notificações.
 * Implementa criação, leitura, atualização, exclusão e marcação como lida.
 *
 * @module modules/notifications/notifications.service
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository.js';
import type { CreateNotificationData, UpdateNotificationData } from './notification.model.js';

/**
 * NotificationsService
 *
 * Camada de regras de negócio para notificações. Implementa criação, leitura,
 * atualização, exclusão, marcação como lida e contagem de não lidas, com
 * consultas direcionadas por usuário.
 *
 * Convenções:
 * - Lança NotFoundException quando uma notificação não existe.
 * - Retornos padronizados para operações de deleção e marcação.
 *
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  /**
   * Cria uma nova notificação.
   *
   * @param data Dados da notificação (usuário, tipo, mensagem, etc.).
   * @returns Notificação criada.
   */
  async createNotification(data: CreateNotificationData) {
    return await this.notificationsRepository.create(data);
  }

  /**
   * Retorna uma notificação por ID.
   *
   * @param id ID da notificação.
   * @returns Notificação encontrada.
   * @throws NotFoundException se não existir.
   */
  async getNotificationById(id: string) {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) throw new NotFoundException('Notificação não encontrada');
    return notification;
  }

  /**
   * Lista notificações de um usuário.
   *
   * @param userId ID do usuário.
   * @param unreadOnly Quando `true`, retorna apenas não lidas.
   * @returns Coleção de notificações do usuário.
   */
  async getNotificationsByUser(userId: string, unreadOnly: boolean = false) {
    return await this.notificationsRepository.findByUser(userId, { unreadOnly });
  }

  /**
   * Atualiza atributos de uma notificação.
   *
   * @param id ID da notificação.
   * @param data Dados a atualizar.
   * @returns Notificação atualizada.
   */
  async updateNotification(id: string, data: UpdateNotificationData) {
    await this.getNotificationById(id);
    return await this.notificationsRepository.update(id, data);
  }

  /**
   * Remove uma notificação por ID.
   *
   * @param id ID da notificação.
   * @returns Objeto `{ success: true }` em caso de sucesso.
   */
  async deleteNotification(id: string) {
    await this.getNotificationById(id);
    await this.notificationsRepository.delete(id);
    return { success: true };
  }

  /**
   * Marca uma notificação como lida.
   *
   * @param id ID da notificação.
   * @returns Notificação com `isRead: true`.
   * @throws NotFoundException se a notificação não existir.
   */
  async markAsRead(id: string) {
    await this.getNotificationById(id); // Verifica se existe antes de atualizar
    return await this.notificationsRepository.update(id, { isRead: true });
  }

  /**
   * Marca todas as notificações de um usuário como lidas.
   *
   * @param userId ID do usuário.
   * @returns Objeto `{ success: true, count }` com a quantidade afetada.
   */
  async markAllAsRead(userId: string) {
    const count = await this.notificationsRepository.markAllAsRead(userId);
    return { success: true, count };
  }

  /**
   * Retorna a contagem de notificações não lidas de um usuário.
   *
   * @param userId ID do usuário.
   * @returns Objeto `{ count }` com a contagem agregada.
   */
  async countUnread(userId: string) {
    const count = await this.notificationsRepository.countUnread(userId);
    return { count };
  }
}


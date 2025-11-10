/**
 * Módulo de Notificações
*
* Módulo NestJS para gerenciamento de notificações e alertas.
* Consolida controllers e services para criação, listagem, envio e
* atualização de notificações.
 *
 * Controllers:
 * - NotificationsController
 *
 * Providers:
 * - NotificationsService
 * - NotificationsRepository
 *
 * Exports:
 * - NotificationsService
 * - NotificationsRepository
 *
 *
 * @module modules/notifications/notifications.module
 */
import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationsRepository } from './notifications.repository.js';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsRepository],
  exports: [NotificationsService, NotificationsRepository],
})
export class NotificationsModule {}


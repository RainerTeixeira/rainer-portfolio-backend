/**
 * Controlador de Notificações
 *
 * Controller NestJS para endpoints de notificações.
 * Implementa rotas REST com documentação Swagger.
 *
 * @module modules/notifications/notifications.controller
 */
import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import type { CreateNotificationData, UpdateNotificationData } from './notification.model.js';

/**
 * NotificationsController
 *
 * Endpoints REST para gerenciar notificações (CRUD, leitura e contagem).
 *
 * Convenções:
 * - Respostas com `{ success: true, data }` quando apropriado.
 * - Ações de marcação/contagem retornam objetos simples e claros.
 *
 * Integração Swagger:
 * - `@ApiTags`, `@ApiOperation`, `@ApiParam`, `@ApiQuery`, `@ApiBody` com exemplos.
 *
 */
@ApiTags('🔔 Notificações')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Cria nova notificação.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '🔔 Criar Notificação' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        type: { type: 'string', example: 'COMMENT', enum: ['COMMENT', 'LIKE', 'REPLY', 'MENTION'] },
        title: { type: 'string', example: 'Novo comentário' },
        message: { type: 'string', example: 'Alguém comentou no seu post' },
        relatedId: { type: 'string', example: '507f1f77bcf86cd799439022', nullable: true },
      },
      required: ['userId', 'type', 'title', 'message'],
    },
  })
  async create(@Body() data: CreateNotificationData) {
    const notification = await this.notificationsService.createNotification(data);
    return { success: true, data: notification };
  }

  /**
   * Busca notificação por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Notificação' })
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    const notification = await this.notificationsService.getNotificationById(id);
    return { success: true, data: notification };
  }

  /**
   * Lista notificações de um usuário (opcionalmente apenas não lidas).
   */
  @Get('user/:userId')
  @ApiOperation({ summary: '👤 Notificações do Usuário' })
  @ApiParam({ name: 'userId' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async getByUser(@Param('userId') userId: string, @Query('unreadOnly') unreadOnly?: boolean) {
    const notifications = await this.notificationsService.getNotificationsByUser(userId, unreadOnly);
    return { success: true, data: notifications };
  }

  /**
   * Conta notificações não lidas de um usuário.
   */
  @Get('user/:userId/unread/count')
  @ApiOperation({ summary: '🔢 Contar Não Lidas' })
  @ApiParam({ name: 'userId' })
  async countUnread(@Param('userId') userId: string) {
    return await this.notificationsService.countUnread(userId);
  }

  /**
   * Atualiza atributos de uma notificação.
   */
  @Put(':id')
  @ApiOperation({ summary: '✏️ Atualizar Notificação' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isRead: { type: 'boolean', example: true },
      },
    },
  })
  async updateNotification(@Param('id') id: string, @Body() data: UpdateNotificationData) {
    const notification = await this.notificationsService.updateNotification(id, data);
    return { success: true, data: notification };
  }

  /**
   * Remove notificação por ID.
   */
  @Delete(':id')
  @ApiOperation({ summary: '🗑️ Deletar Notificação' })
  @ApiParam({ name: 'id' })
  async deleteNotification(@Param('id') id: string) {
    return await this.notificationsService.deleteNotification(id);
  }

  /**
   * Marca uma notificação como lida.
   */
  @Patch(':id/read')
  @ApiOperation({ summary: '✅ Marcar como Lida' })
  @ApiParam({ name: 'id' })
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(id);
    return { success: true, data: notification };
  }

  /**
   * Marca todas as notificações de um usuário como lidas.
   */
  @Patch('user/:userId/read-all')
  @ApiOperation({ summary: '✅ Marcar Todas como Lidas' })
  @ApiParam({ name: 'userId' })
  async markAllAsRead(@Param('userId') userId: string) {
    return await this.notificationsService.markAllAsRead(userId);
  }
}


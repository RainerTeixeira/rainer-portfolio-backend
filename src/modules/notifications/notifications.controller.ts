import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service.js';
import type { CreateNotificationData, UpdateNotificationData } from './notification.model.js';

@ApiTags('🔔 Notificações')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '🔔 Criar Notificação' })
  async create(@Body() data: CreateNotificationData) {
    const notification = await this.notificationsService.createNotification(data);
    return { success: true, data: notification };
  }

  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Notificação' })
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    const notification = await this.notificationsService.getNotificationById(id);
    return { success: true, data: notification };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '👤 Notificações do Usuário' })
  @ApiParam({ name: 'userId' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  async getByUser(@Param('userId') userId: string, @Query('unreadOnly') unreadOnly?: boolean) {
    const notifications = await this.notificationsService.getNotificationsByUser(userId, unreadOnly);
    return { success: true, data: notifications };
  }

  @Get('user/:userId/unread/count')
  @ApiOperation({ summary: '🔢 Contar Não Lidas' })
  @ApiParam({ name: 'userId' })
  async countUnread(@Param('userId') userId: string) {
    return await this.notificationsService.countUnread(userId);
  }

  @Put(':id')
  @ApiOperation({ summary: '✏️ Atualizar Notificação' })
  @ApiParam({ name: 'id' })
  async updateNotification(@Param('id') id: string, @Body() data: UpdateNotificationData) {
    const notification = await this.notificationsService.updateNotification(id, data);
    return { success: true, data: notification };
  }

  @Delete(':id')
  @ApiOperation({ summary: '🗑️ Deletar Notificação' })
  @ApiParam({ name: 'id' })
  async deleteNotification(@Param('id') id: string) {
    return await this.notificationsService.deleteNotification(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '✅ Marcar como Lida' })
  @ApiParam({ name: 'id' })
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationsService.markAsRead(id);
    return { success: true, data: notification };
  }

  @Patch('user/:userId/read-all')
  @ApiOperation({ summary: '✅ Marcar Todas como Lidas' })
  @ApiParam({ name: 'userId' })
  async markAllAsRead(@Param('userId') userId: string) {
    return await this.notificationsService.markAllAsRead(userId);
  }
}


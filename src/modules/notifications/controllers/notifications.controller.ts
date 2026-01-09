/**
 * @fileoverview Controller de Notificações
 *
 * Endpoints HTTP para criação, listagem, leitura e remoção de notificações.
 *
 * Observações:
 * - `GET /notifications` exige `userId` via query. Atualmente, quando ausente,
 *   o controller lança `Error` genérico.
 * - Existem endpoints de “conveniência” (`/like`, `/comment`, `/follower`) que
 *   encapsulam casos comuns de notificação.
 *
 * @module modules/notifications/controllers/notifications.controller
 */

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from '../services/notifications.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Cria uma notificação genérica.
   *
   * @param {CreateNotificationDto} dto Dados da notificação.
   * @returns {unknown} Notificação criada.
   */
  @Post()
  @ApiOperation({
    summary: 'Criar notificação',
    description: 'Cria uma nova notificação para um usuário',
  })
  @ApiResponse({
    status: 201,
    description: 'Notificação criada com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(dto);
  }

  /**
   * Lista notificações de um usuário.
   *
   * Requer `userId` via query; opcionalmente aceita paginação e filtro de não lidas.
   *
   * @param {object} query Query params.
   * @returns {unknown} Lista de notificações.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar notificações',
    description: 'Lista notificações de um usuário com filtros e paginação',
  })
  @ApiQuery({ name: 'userId', required: true, description: 'ID do usuário' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação' })
  @ApiQuery({ name: 'unreadOnly', required: false, description: 'Apenas não lidas (true/false)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações retornada',
    type: ApiResponseDto,
  })
  findAll(@Query() query: {
    userId?: string;
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }) {
    if (!query.userId) {
      throw new Error('userId is required');
    }
    return this.notificationsService.getUserNotifications(query.userId, query);
  }

  /**
   * Busca uma notificação pelo ID.
   *
   * @param {string} id ID da notificação.
   * @returns {unknown} Notificação.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar notificação por ID',
    description: 'Retorna uma notificação específica pelo seu ID',
  })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({
    status: 200,
    description: 'Notificação encontrada',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Notificação não encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.notificationsService.getNotificationById(id);
  }

  /**
   * Retorna a contagem de notificações não lidas de um usuário.
   *
   * @param {string} userId ID do usuário.
   * @returns {unknown} Contagem.
   */
  @Get('user/:userId/unread-count')
  @ApiOperation({
    summary: 'Contar notificações não lidas',
    description: 'Retorna o número de notificações não lidas para um usuário',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Contagem de notificações não lidas',
    type: ApiResponseDto,
  })
  getUnreadCount(@Param('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * Marca uma notificação específica como lida.
   *
   * @param {string} id ID da notificação.
   * @returns {unknown} Resultado da operação.
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Marcar notificação como lida',
    description: 'Marca uma notificação específica como lida',
  })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({
    status: 200,
    description: 'Notificação marcada como lida',
    type: ApiResponseDto,
  })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  /**
   * Marca todas as notificações de um usuário como lidas.
   *
   * @param {string} userId ID do usuário.
   * @returns {unknown} Resultado da operação.
   */
  @Patch('user/:userId/read-all')
  @ApiOperation({
    summary: 'Marcar todas como lidas',
    description: 'Marca todas as notificações de um usuário como lidas',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Todas as notificações marcadas como lidas',
    type: ApiResponseDto,
  })
  markAllAsRead(@Param('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * Remove uma notificação pelo ID.
   *
   * @param {string} id ID da notificação.
   * @returns {unknown} Resultado da remoção.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar notificação',
    description: 'Remove permanentemente uma notificação',
  })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({
    status: 200,
    description: 'Notificação deletada com sucesso',
    type: ApiResponseDto,
  })
  remove(@Param('id') id: string) {
    return this.notificationsService.deleteNotification(id);
  }

  /**
   * Remove todas as notificações de um usuário.
   *
   * @param {string} userId ID do usuário.
   * @returns {unknown} Resultado da operação.
   */
  @Delete('user/:userId/all')
  @ApiOperation({
    summary: 'Deletar todas as notificações',
    description: 'Remove permanentemente todas as notificações de um usuário',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Todas as notificações deletadas com sucesso',
    type: ApiResponseDto,
  })
  removeAll(@Param('userId') userId: string) {
    return this.notificationsService.deleteAllNotifications(userId);
  }

  // Endpoints de conveniência
  /**
   * Cria uma notificação de “novo like”.
   *
   * @param {{ userId: string; postId: string; userName: string }} body Payload de criação.
   * @returns {unknown} Notificação criada.
   */
  @Post('like')
  @ApiOperation({
    summary: 'Notificar nova curtida',
    description: 'Cria uma notificação quando um post recebe uma curtida',
  })
  @ApiResponse({
    status: 201,
    description: 'Notificação criada com sucesso',
    type: ApiResponseDto,
  })
  notifyLike(@Body() body: { userId: string; postId: string; userName: string }) {
    return this.notificationsService.notifyNewLike(body.userId, body.postId, body.userName);
  }

  /**
   * Cria uma notificação de “novo comentário”.
   *
   * @param {{ userId: string; postId: string; commentId: string; userName: string }} body Payload de criação.
   * @returns {unknown} Notificação criada.
   */
  @Post('comment')
  @ApiOperation({
    summary: 'Notificar novo comentário',
    description: 'Cria uma notificação quando um post recebe um comentário',
  })
  @ApiResponse({
    status: 201,
    description: 'Notificação criada com sucesso',
    type: ApiResponseDto,
  })
  notifyComment(@Body() body: { userId: string; postId: string; commentId: string; userName: string }) {
    return this.notificationsService.notifyNewComment(body.userId, body.postId, body.commentId, body.userName);
  }

  /**
   * Cria uma notificação de “novo seguidor”.
   *
   * @param {{ userId: string; followerId: string; followerName: string }} body Payload de criação.
   * @returns {unknown} Notificação criada.
   */
  @Post('follower')
  @ApiOperation({
    summary: 'Notificar novo seguidor',
    description: 'Cria uma notificação quando um usuário ganha um novo seguidor',
  })
  @ApiResponse({
    status: 201,
    description: 'Notificação criada com sucesso',
    type: ApiResponseDto,
  })
  notifyFollower(@Body() body: { userId: string; followerId: string; followerName: string }) {
    return this.notificationsService.notifyNewFollower(body.userId, body.followerId, body.followerName);
  }
}

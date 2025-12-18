/**
 * Controlador de Likes
 *
 * Controller NestJS para endpoints de likes.
 * Implementa rotas REST com documentação Swagger.
 *
 * @module modules/likes/likes.controller
 */
import { Controller, Get, Post, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { LikesService } from './likes.service.js';
import type { CreateLikeData } from './like.model.js';

/**
 * LikesController
 *
 * Endpoints REST para gerenciar likes em posts (curtir, descurtir, consultas).
 *
 * Convenções de resposta:
 * - Sucesso: `{ success: true, data?: any }` quando aplicável.
 * - Operações de estado (descurtir/contagem/verificação): retornos simples e objetivos.
 *
 * Integração Swagger:
 * - `@ApiTags`, `@ApiOperation`, `@ApiParam` e `@ApiBody` para documentar cada rota.
 *
 */
@ApiTags('❤️ Likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * Cria like para um post.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '❤️ Curtir Post' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        postId: { type: 'string', example: '507f1f77bcf86cd799439022' },
      },
      required: ['userId', 'postId'],
    },
  })
  async like(@Body() data: CreateLikeData) {
    const like = await this.likesService.likePost(data);
    return { success: true, data: like };
  }

  /**
   * Remove like (descurtir) de um post.
   */
  @Delete(':userId/:postId')
  @ApiOperation({ summary: '💔 Descurtir Post' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'postId' })
  async unlike(@Param('userId') userId: string, @Param('postId') postId: string) {
    return await this.likesService.unlikePost(userId, postId);
  }

  /**
   * Lista likes de um post.
   */
  @Get('post/:postId')
  @ApiOperation({ summary: '📊 Likes do Post' })
  @ApiParam({ name: 'postId' })
  async getByPost(@Param('postId') postId: string) {
    const likes = await this.likesService.getLikesByPost(postId);
    return { success: true, data: likes };
  }

  /**
   * Lista likes de um usuário.
   */
  @Get('user/:userId')
  @ApiOperation({ summary: '👤 Likes do Usuário' })
  @ApiParam({ name: 'userId' })
  async getByUser(@Param('userId') userId: string) {
    const likes = await this.likesService.getLikesByUser(userId);
    return { success: true, data: likes };
  }

  /**
   * Conta likes de um post.
   */
  @Get('post/:postId/count')
  @ApiOperation({ summary: '🔢 Contar Likes' })
  @ApiParam({ name: 'postId' })
  async count(@Param('postId') postId: string) {
    return await this.likesService.getLikesCount(postId);
  }

  /**
   * Verifica se usuário curtiu um post.
   */
  @Get(':userId/:postId/check')
  @ApiOperation({ summary: '✅ Verificar Like' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'postId' })
  async check(@Param('userId') userId: string, @Param('postId') postId: string) {
    return await this.likesService.hasUserLiked(userId, postId);
  }
}


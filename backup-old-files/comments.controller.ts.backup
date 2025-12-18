/**
 * Controlador de Comentários
 *
 * Controller NestJS para endpoints de comentários.
 * Implementa rotas REST com documentação Swagger.
 *
 * @module modules/comments/comments.controller
 */
import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CommentsService } from './comments.service.js';
import type { CreateCommentData, UpdateCommentData } from './comment.model.js';

/**
 * CommentsController
 *
 * Endpoints REST para gerenciar comentários de posts (CRUD e moderação).
 *
 * Convenções:
 * - Respostas padronizadas com `{ success: true, data }`.
 * - Operações de moderação retornam o comentário atualizado.
 *
 * Integração Swagger:
 * - `@ApiTags`, `@ApiOperation`, `@ApiParam`, `@ApiQuery`, `@ApiBody` com exemplos.
 *
 */
@ApiTags('💬 Comentários')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Cria novo comentário.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '➕ Criar Comentário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Excelente artigo! Muito informativo.' },
        postId: { type: 'string', example: '507f1f77bcf86cd799439022' },
        authorId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        parentId: { type: 'string', example: '507f1f77bcf86cd799439033', nullable: true },
      },
      required: ['content', 'postId', 'authorId'],
    },
  })
  async create(@Body() data: CreateCommentData) {
    const comment = await this.commentsService.createComment(data);
    return { success: true, data: comment };
  }

  /**
   * Lista comentários com paginação.
   */
  @Get()
  @ApiOperation({ summary: '📋 Listar Todos os Comentários' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async listAll(
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    const comments = await this.commentsService.listComments({ limit, page });
    return { success: true, data: comments };
  }

  /**
   * Busca comentário por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Comentário' })
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    const comment = await this.commentsService.getCommentById(id);
    return { success: true, data: comment };
  }

  /**
   * Lista comentários de um post.
   */
  @Get('post/:postId')
  @ApiOperation({ summary: '📄 Comentários do Post' })
  @ApiParam({ name: 'postId' })
  async getByPost(@Param('postId') postId: string) {
    const comments = await this.commentsService.getCommentsByPost(postId);
    return { success: true, data: comments };
  }

  /**
   * Lista comentários de um autor.
   */
  @Get('user/:authorId')
  @ApiOperation({ summary: '👤 Comentários do Usuário' })
  @ApiParam({ name: 'authorId' })
  async getByAuthor(@Param('authorId') authorId: string) {
    const comments = await this.commentsService.getCommentsByAuthor(authorId);
    return { success: true, data: comments };
  }

  /**
   * Atualiza comentário existente.
   */
  @Put(':id')
  @ApiOperation({ summary: '✏️ Atualizar Comentário' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content: { type: 'string', example: 'Comentário atualizado com nova informação.' },
      },
    },
  })
  async update(@Param('id') id: string, @Body() data: UpdateCommentData) {
    const comment = await this.commentsService.updateComment(id, data);
    return { success: true, data: comment };
  }

  /**
   * Remove comentário por ID.
   */
  @Delete(':id')
  @ApiOperation({ summary: '🗑️ Deletar Comentário' })
  @ApiParam({ name: 'id' })
  async delete(@Param('id') id: string) {
    return await this.commentsService.deleteComment(id);
  }

  /**
   * Aprova comentário (moderação).
   */
  @Patch(':id/approve')
  @ApiOperation({ summary: '✅ Aprovar Comentário' })
  @ApiParam({ name: 'id' })
  async approve(@Param('id') id: string) {
    const comment = await this.commentsService.approveComment(id);
    return { success: true, data: comment };
  }

  /**
   * Reprova comentário (moderação).
   */
  @Patch(':id/disapprove')
  @ApiOperation({ summary: '❌ Reprovar Comentário' })
  @ApiParam({ name: 'id' })
  async disapprove(@Param('id') id: string) {
    const comment = await this.commentsService.disapproveComment(id);
    return { success: true, data: comment };
  }
}


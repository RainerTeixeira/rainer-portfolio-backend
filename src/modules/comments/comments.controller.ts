import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service.js';
import type { CreateCommentData, UpdateCommentData } from './comment.model.js';

@ApiTags('💬 Comentários')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '➕ Criar Comentário' })
  async create(@Body() data: CreateCommentData) {
    const comment = await this.commentsService.createComment(data);
    return { success: true, data: comment };
  }

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

  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Comentário' })
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    const comment = await this.commentsService.getCommentById(id);
    return { success: true, data: comment };
  }

  @Get('post/:postId')
  @ApiOperation({ summary: '📄 Comentários do Post' })
  @ApiParam({ name: 'postId' })
  async getByPost(@Param('postId') postId: string) {
    const comments = await this.commentsService.getCommentsByPost(postId);
    return { success: true, data: comments };
  }

  @Get('user/:authorId')
  @ApiOperation({ summary: '👤 Comentários do Usuário' })
  @ApiParam({ name: 'authorId' })
  async getByAuthor(@Param('authorId') authorId: string) {
    const comments = await this.commentsService.getCommentsByAuthor(authorId);
    return { success: true, data: comments };
  }

  @Put(':id')
  @ApiOperation({ summary: '✏️ Atualizar Comentário' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() data: UpdateCommentData) {
    const comment = await this.commentsService.updateComment(id, data);
    return { success: true, data: comment };
  }

  @Delete(':id')
  @ApiOperation({ summary: '🗑️ Deletar Comentário' })
  @ApiParam({ name: 'id' })
  async delete(@Param('id') id: string) {
    return await this.commentsService.deleteComment(id);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: '✅ Aprovar Comentário' })
  @ApiParam({ name: 'id' })
  async approve(@Param('id') id: string) {
    const comment = await this.commentsService.approveComment(id);
    return { success: true, data: comment };
  }

  @Patch(':id/disapprove')
  @ApiOperation({ summary: '❌ Reprovar Comentário' })
  @ApiParam({ name: 'id' })
  async disapprove(@Param('id') id: string) {
    const comment = await this.commentsService.disapproveComment(id);
    return { success: true, data: comment };
  }
}


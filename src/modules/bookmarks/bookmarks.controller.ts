/**
 * Controlador de Bookmarks
 *
 * Controller NestJS para endpoints de favoritos (bookmarks).
 * Implementa rotas REST com documentação Swagger.
 *
 * @module modules/bookmarks/bookmarks.controller
 */
import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service.js';
import type { CreateBookmarkData, UpdateBookmarkData } from './bookmark.model.js';

/**
 * BookmarksController
 *
 * Endpoints REST para gerenciar bookmarks (salvar, listar, organizar, remover posts).
 */
@ApiTags('🔖 Bookmarks')
@Controller('bookmarks')
/**
 * BookmarksController
 *
 * Controlador responsável por favoritos (bookmarks) de usuários.
 *
 * Rotas:
 * - POST   `/bookmarks`                          – Salvar post nos favoritos
 * - GET    `/bookmarks/:id`                      – Buscar bookmark por ID
 * - GET    `/bookmarks/user/:userId`             – Listar bookmarks do usuário
 * - GET    `/bookmarks/user/:userId/collection`  – Listar por coleção (query `collection`)
 * - PUT    `/bookmarks/:id`                      – Atualizar coleção/notas do bookmark
 * - DELETE `/bookmarks/:id`                      – Remover bookmark por ID
 * - DELETE `/bookmarks/user/:userId/post/:postId` – Remover pelo par usuário/post
 *
 * Convenções de resposta:
 * - Retorna objetos com `success` e, quando aplicável, `data`, `message` e `count`.
 * - Erros e validações seguem pipes/guards globais e códigos HTTP padronizados.
 *
 * Regras de negócio:
 * - Um bookmark é único por par `userId` + `postId` (constraint de unicidade).
 * - Suporta organização por `collection` e campo livre `notes` pelo usuário.
 *
 * Swagger:
 * - Decorators por endpoint descrevem parâmetros de rota, query e corpo.
 * - Este bloco é apenas documentação; nenhuma lógica foi alterada.
 */
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  /**
   * Cria bookmark (salva post).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '🔖 Salvar Post' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        postId: { type: 'string', example: '507f1f77bcf86cd799439022' },
        collection: { type: 'string', example: 'Favoritos', nullable: true },
        notes: { type: 'string', example: 'Artigo interessante para reler', nullable: true },
      },
      required: ['userId', 'postId'],
    },
  })
  async create(@Body() data: CreateBookmarkData) {
    const bookmark = await this.bookmarksService.createBookmark(data);
    return { success: true, data: bookmark };
  }

  /**
   * Busca bookmark por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Bookmark' })
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    const bookmark = await this.bookmarksService.getBookmarkById(id);
    return { success: true, data: bookmark };
  }

  /**
   * Lista bookmarks de um usuário.
   */
  @Get('user/:userId')
  @ApiOperation({ summary: '👤 Bookmarks do Usuário' })
  @ApiParam({ name: 'userId' })
  async getByUser(@Param('userId') userId: string) {
    const bookmarks = await this.bookmarksService.getBookmarksByUser(userId);
    return { success: true, data: bookmarks };
  }

  /**
   * Lista bookmarks de uma coleção do usuário.
   */
  @Get('user/:userId/collection')
  @ApiOperation({ summary: '📂 Bookmarks por Coleção' })
  @ApiParam({ name: 'userId' })
  @ApiQuery({ name: 'collection', required: true })
  async getByCollection(@Param('userId') userId: string, @Query('collection') collection: string) {
    const bookmarks = await this.bookmarksService.getBookmarksByCollection(userId, collection);
    return { success: true, data: bookmarks };
  }

  /**
   * Atualiza bookmark (coleção, notas).
   */
  @Put(':id')
  @ApiOperation({ summary: '✏️ Atualizar Bookmark' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        collection: { type: 'string', example: 'Ler Depois', nullable: true },
        notes: { type: 'string', example: 'Atualizado: preciso revisar', nullable: true },
      },
    },
  })
  async update(@Param('id') id: string, @Body() data: UpdateBookmarkData) {
    const bookmark = await this.bookmarksService.updateBookmark(id, data);
    return { success: true, data: bookmark };
  }

  /**
   * Remove bookmark por ID.
   */
  @Delete(':id')
  @ApiOperation({ summary: '🗑️ Deletar Bookmark' })
  @ApiParam({ name: 'id' })
  async delete(@Param('id') id: string) {
    return await this.bookmarksService.deleteBookmark(id);
  }

  /**
   * Remove bookmark localizando pelo par usuário/post.
   */
  @Delete('user/:userId/post/:postId')
  @ApiOperation({ summary: '❌ Remover dos Favoritos' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'postId' })
  async deleteByPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return await this.bookmarksService.deleteByUserAndPost(userId, postId);
  }
}


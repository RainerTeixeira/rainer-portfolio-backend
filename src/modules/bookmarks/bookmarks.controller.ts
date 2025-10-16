import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service.js';
import type { CreateBookmarkData, UpdateBookmarkData } from './bookmark.model.js';

@ApiTags('🔖 Bookmarks')
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '🔖 Salvar Post' })
  async create(@Body() data: CreateBookmarkData) {
    const bookmark = await this.bookmarksService.createBookmark(data);
    return { success: true, data: bookmark };
  }

  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Bookmark' })
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    const bookmark = await this.bookmarksService.getBookmarkById(id);
    return { success: true, data: bookmark };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '👤 Bookmarks do Usuário' })
  @ApiParam({ name: 'userId' })
  async getByUser(@Param('userId') userId: string) {
    const bookmarks = await this.bookmarksService.getBookmarksByUser(userId);
    return { success: true, data: bookmarks };
  }

  @Get('user/:userId/collection')
  @ApiOperation({ summary: '📂 Bookmarks por Coleção' })
  @ApiParam({ name: 'userId' })
  @ApiQuery({ name: 'name', required: true })
  async getByCollection(@Param('userId') userId: string, @Query('name') collection: string) {
    const bookmarks = await this.bookmarksService.getBookmarksByCollection(userId, collection);
    return { success: true, data: bookmarks };
  }

  @Put(':id')
  @ApiOperation({ summary: '✏️ Atualizar Bookmark' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() data: UpdateBookmarkData) {
    const bookmark = await this.bookmarksService.updateBookmark(id, data);
    return { success: true, data: bookmark };
  }

  @Delete(':id')
  @ApiOperation({ summary: '🗑️ Deletar Bookmark' })
  @ApiParam({ name: 'id' })
  async delete(@Param('id') id: string) {
    return await this.bookmarksService.deleteBookmark(id);
  }

  @Delete('user/:userId/post/:postId')
  @ApiOperation({ summary: '❌ Remover dos Favoritos' })
  @ApiParam({ name: 'userId' })
  @ApiParam({ name: 'postId' })
  async deleteByPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return await this.bookmarksService.deleteByUserAndPost(userId, postId);
  }
}


/**
 * @fileoverview Controller de Bookmarks (Favoritos)
 *
 * Endpoints HTTP para gerenciar favoritos (bookmarks) de posts e comentários.
 *
 * Conceitos:
 * - Um bookmark é uma relação usuário -> (post|comment).
 * - As rotas deste controller separam explicitamente operações em post vs comment.
 *
 * Papel do controller:
 * - Receber requisições e extrair parâmetros.
 * - Delegar as operações ao `BookmarksService`.
 * - Expor documentação Swagger via decorators.
 *
 * @module modules/bookmarks/controllers/bookmarks.controller
 */

import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BookmarksService } from '../services/bookmarks.service';
import { CreateBookmarkDto } from '../dto/create-bookmark.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';

@ApiTags('bookmarks')
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  /**
   * Favorita um post para um usuário.
   *
   * @param {CreateBookmarkDto} dto Dados do vínculo usuário->post.
   * @returns {unknown} Bookmark criado ou existente.
   */
  @Post('post')
  @ApiOperation({
    summary: 'Favoritar post',
    description: 'Adiciona um post aos favoritos do usuário',
  })
  @ApiResponse({
    status: 201,
    description: 'Post favoritado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou já favoritado',
  })
  bookmarkPost(@Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.bookmarkPost(dto);
  }

  /**
   * Favorita um comentário para um usuário.
   *
   * @param {CreateBookmarkDto} dto Dados do vínculo usuário->comentário.
   * @returns {unknown} Bookmark criado ou existente.
   */
  @Post('comment')
  @ApiOperation({
    summary: 'Favoritar comentário',
    description: 'Adiciona um comentário aos favoritos do usuário',
  })
  @ApiResponse({
    status: 201,
    description: 'Comentário favoritado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou já favoritado',
  })
  bookmarkComment(@Body() dto: CreateBookmarkDto) {
    return this.bookmarksService.bookmarkComment(dto);
  }

  /**
   * Remove o favorito de um post para um usuário.
   *
   * @param {string} userId ID do usuário.
   * @param {string} postId ID do post.
   * @returns {unknown} Resultado da operação.
   */
  @Delete('post/:userId/:postId')
  @ApiOperation({
    summary: 'Desfavoritar post',
    description: 'Remove um post dos favoritos do usuário',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'postId', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Post desfavoritado com sucesso',
    type: ApiResponseDto,
  })
  unbookmarkPost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.bookmarksService.unbookmarkPost(userId, postId);
  }

  /**
   * Remove o favorito de um comentário para um usuário.
   *
   * @param {string} userId ID do usuário.
   * @param {string} commentId ID do comentário.
   * @returns {unknown} Resultado da operação.
   */
  @Delete('comment/:userId/:commentId')
  @ApiOperation({
    summary: 'Desfavoritar comentário',
    description: 'Remove um comentário dos favoritos do usuário',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'commentId', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Comentário desfavoritado com sucesso',
    type: ApiResponseDto,
  })
  unbookmarkComment(@Param('userId') userId: string, @Param('commentId') commentId: string) {
    return this.bookmarksService.unbookmarkComment(userId, commentId);
  }

  /**
   * Busca um bookmark pelo ID.
   *
   * @param {string} id ID do favorito.
   * @returns {unknown} Favorito encontrado.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar favorito por ID',
    description: 'Retorna um favorito específico pelo seu ID',
  })
  @ApiParam({ name: 'id', description: 'ID do favorito' })
  @ApiResponse({
    status: 200,
    description: 'Favorito encontrado',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Favorito não encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.bookmarksService.getBookmarkById(id);
  }

  /**
   * Lista todos os bookmarks relacionados a um post.
   *
   * @param {string} postId ID do post.
   * @returns {unknown} Lista de favoritos do post.
   */
  @Get('post/:postId')
  @ApiOperation({
    summary: 'Listar favoritos do post',
    description: 'Retorna todos os favoritos de um post específico',
  })
  @ApiParam({ name: 'postId', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos retornada',
    type: ApiResponseDto,
  })
  getPostBookmarks(@Param('postId') postId: string) {
    return this.bookmarksService.getPostBookmarks(postId);
  }

  /**
   * Lista todos os bookmarks relacionados a um comentário.
   *
   * @param {string} commentId ID do comentário.
   * @returns {unknown} Lista de favoritos do comentário.
   */
  @Get('comment/:commentId')
  @ApiOperation({
    summary: 'Listar favoritos do comentário',
    description: 'Retorna todos os favoritos de um comentário específico',
  })
  @ApiParam({ name: 'commentId', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos retornada',
    type: ApiResponseDto,
  })
  getCommentBookmarks(@Param('commentId') commentId: string) {
    return this.bookmarksService.getCommentBookmarks(commentId);
  }

  /**
   * Lista bookmarks de um usuário com suporte a paginação.
   *
   * @param {string} userId ID do usuário.
   * @param {{ limit?: number; offset?: number }} query Parâmetros de paginação.
   * @returns {unknown} Lista de favoritos do usuário.
   */
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Listar favoritos do usuário',
    description: 'Retorna todos os favoritos de um usuário específico com paginação',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de favoritos retornada',
    type: ApiResponseDto,
  })
  getUserBookmarks(
    @Param('userId') userId: string,
    @Query() query: { limit?: number; offset?: number }
  ) {
    return this.bookmarksService.getUserBookmarks(userId, query);
  }

  /**
   * Verifica se um usuário já favoritou um post.
   *
   * @param {string} userId ID do usuário.
   * @param {string} postId ID do post.
   * @returns {unknown} Boolean indicando se existe bookmark.
   */
  @Get('post/:userId/:postId/bookmarked')
  @ApiOperation({
    summary: 'Verificar se usuário favoritou post',
    description: 'Verifica se um usuário específico favoritou um post',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'postId', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Status do favorito retornado',
    type: ApiResponseDto,
  })
  isPostBookmarked(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.bookmarksService.isPostBookmarkedByUser(userId, postId);
  }

  /**
   * Verifica se um usuário já favoritou um comentário.
   *
   * @param {string} userId ID do usuário.
   * @param {string} commentId ID do comentário.
   * @returns {unknown} Boolean indicando se existe bookmark.
   */
  @Get('comment/:userId/:commentId/bookmarked')
  @ApiOperation({
    summary: 'Verificar se usuário favoritou comentário',
    description: 'Verifica se um usuário específico favoritou um comentário',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'commentId', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Status do favorito retornado',
    type: ApiResponseDto,
  })
  isCommentBookmarked(@Param('userId') userId: string, @Param('commentId') commentId: string) {
    return this.bookmarksService.isCommentBookmarkedByUser(userId, commentId);
  }
}

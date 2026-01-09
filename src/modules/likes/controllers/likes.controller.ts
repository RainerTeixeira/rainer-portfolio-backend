/**
 * @fileoverview Controller de Likes (Curtidas)
 *
 * Endpoints HTTP para curtir/descurtir posts e comentários, além de consultas
 * relacionadas (ex.: listar curtidas de um post e verificar se um usuário curtiu).
 *
 * Conceitos:
 * - Um like é uma relação usuário -> (post|comment).
 * - As rotas são segmentadas em `post` e `comment` para tornar o contrato explícito.
 *
 * @module modules/likes/controllers/likes.controller
 */

import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LikesService } from '../services/likes.service';
import { CreateLikeDto } from '../dto/create-like.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';

@ApiTags('likes')
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  /**
   * Registra uma curtida em um post.
   *
   * @param {CreateLikeDto} dto Dados do like.
   * @returns {unknown} Like criado ou existente.
   */
  @Post('post')
  @ApiOperation({
    summary: 'Curtir post',
    description: 'Adiciona uma curtida a um post',
  })
  @ApiResponse({
    status: 201,
    description: 'Post curtido com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou já curtiu',
  })
  likePost(@Body() dto: CreateLikeDto) {
    return this.likesService.likePost(dto);
  }

  /**
   * Registra uma curtida em um comentário.
   *
   * @param {CreateLikeDto} dto Dados do like.
   * @returns {unknown} Like criado ou existente.
   */
  @Post('comment')
  @ApiOperation({
    summary: 'Curtir comentário',
    description: 'Adiciona uma curtida a um comentário',
  })
  @ApiResponse({
    status: 201,
    description: 'Comentário curtido com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou já curtiu',
  })
  likeComment(@Body() dto: CreateLikeDto) {
    return this.likesService.likeComment(dto);
  }

  /**
   * Remove a curtida de um post (descurtir).
   *
   * @param {string} userId ID do usuário.
   * @param {string} postId ID do post.
   * @returns {unknown} Resultado da operação.
   */
  @Delete('post/:userId/:postId')
  @ApiOperation({
    summary: 'Descurtir post',
    description: 'Remove a curtida de um post',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'postId', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Post descurtido com sucesso',
    type: ApiResponseDto,
  })
  unlikePost(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.likesService.unlikePost(userId, postId);
  }

  /**
   * Remove a curtida de um comentário (descurtir).
   *
   * @param {string} userId ID do usuário.
   * @param {string} commentId ID do comentário.
   * @returns {unknown} Resultado da operação.
   */
  @Delete('comment/:userId/:commentId')
  @ApiOperation({
    summary: 'Descurtir comentário',
    description: 'Remove a curtida de um comentário',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'commentId', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Comentário descurtido com sucesso',
    type: ApiResponseDto,
  })
  unlikeComment(@Param('userId') userId: string, @Param('commentId') commentId: string) {
    return this.likesService.unlikeComment(userId, commentId);
  }

  /**
   * Busca uma curtida pelo ID.
   *
   * @param {string} id ID do like.
   * @returns {unknown} Curtida encontrada.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar curtida por ID',
    description: 'Retorna uma curtida específica pelo seu ID',
  })
  @ApiParam({ name: 'id', description: 'ID da curtida' })
  @ApiResponse({
    status: 200,
    description: 'Curtida encontrada',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Curtida não encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.likesService.getLikeById(id);
  }

  /**
   * Lista curtidas de um post.
   *
   * @param {string} postId ID do post.
   * @returns {unknown} Lista de curtidas.
   */
  @Get('post/:postId')
  @ApiOperation({
    summary: 'Listar curtidas do post',
    description: 'Retorna todas as curtidas de um post específico',
  })
  @ApiParam({ name: 'postId', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Lista de curtidas retornada',
    type: ApiResponseDto,
  })
  getPostLikes(@Param('postId') postId: string) {
    return this.likesService.getPostLikes(postId);
  }

  /**
   * Lista curtidas de um comentário.
   *
   * @param {string} commentId ID do comentário.
   * @returns {unknown} Lista de curtidas.
   */
  @Get('comment/:commentId')
  @ApiOperation({
    summary: 'Listar curtidas do comentário',
    description: 'Retorna todas as curtidas de um comentário específico',
  })
  @ApiParam({ name: 'commentId', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de curtidas retornada',
    type: ApiResponseDto,
  })
  getCommentLikes(@Param('commentId') commentId: string) {
    return this.likesService.getCommentLikes(commentId);
  }

  /**
   * Lista curtidas realizadas por um usuário.
   *
   * @param {string} userId ID do usuário.
   * @returns {unknown} Lista de curtidas.
   */
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Listar curtidas do usuário',
    description: 'Retorna todas as curtidas feitas por um usuário',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de curtidas retornada',
    type: ApiResponseDto,
  })
  getUserLikes(@Param('userId') userId: string) {
    return this.likesService.getUserLikes(userId);
  }

  /**
   * Verifica se um usuário curtiu um post.
   *
   * @param {string} userId ID do usuário.
   * @param {string} postId ID do post.
   * @returns {unknown} Boolean indicando se existe like.
   */
  @Get('post/:userId/:postId/liked')
  @ApiOperation({
    summary: 'Verificar se usuário curtiu post',
    description: 'Verifica se um usuário específico curtiu um post',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'postId', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Status da curtida retornado',
    type: ApiResponseDto,
  })
  isPostLiked(@Param('userId') userId: string, @Param('postId') postId: string) {
    return this.likesService.isPostLikedByUser(userId, postId);
  }

  /**
   * Verifica se um usuário curtiu um comentário.
   *
   * @param {string} userId ID do usuário.
   * @param {string} commentId ID do comentário.
   * @returns {unknown} Boolean indicando se existe like.
   */
  @Get('comment/:userId/:commentId/liked')
  @ApiOperation({
    summary: 'Verificar se usuário curtiu comentário',
    description: 'Verifica se um usuário específico curtiu um comentário',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiParam({ name: 'commentId', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Status da curtida retornado',
    type: ApiResponseDto,
  })
  isCommentLiked(@Param('userId') userId: string, @Param('commentId') commentId: string) {
    return this.likesService.isCommentLikedByUser(userId, commentId);
  }
}

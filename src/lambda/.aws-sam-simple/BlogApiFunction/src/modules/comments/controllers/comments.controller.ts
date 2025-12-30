/**
 * @fileoverview Controller de Comentários
 *
 * Endpoints HTTP para criação, listagem, moderação e remoção de comentários.
 *
 * Observações importantes:
 * - O endpoint de listagem (`GET /comments`) decide qual consulta executar com base
 *   em `query.postId`, `query.authorId` ou `query.parentId`.
 * - Quando nenhum filtro é fornecido, o controller lança um erro (atualmente um
 *   `Error` genérico). A validação/contrato pode ser refinada no futuro.
 *
 * @module modules/comments/controllers/comments.controller
 */

import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from '../services/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Cria um novo comentário.
   *
   * @param {CreateCommentDto} dto Dados do comentário.
   * @returns {unknown} Resultado da criação.
   */
  @Post()
  @ApiOperation({
    summary: 'Criar comentário',
    description: 'Cria um novo comentário em um post',
  })
  @ApiResponse({
    status: 201,
    description: 'Comentário criado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  create(@Body() dto: CreateCommentDto) {
    return this.commentsService.createComment(dto);
  }

  /**
   * Lista comentários aplicando **um** dos filtros suportados.
   *
   * Regras:
   * - Se `postId` existir, lista comentários de um post.
   * - Senão, se `authorId` existir, lista comentários de um autor.
   * - Senão, se `parentId` existir, lista respostas de um comentário pai.
   * - Caso nenhum seja informado, lança erro.
   *
   * @param {object} query Filtros e paginação.
   * @returns {unknown} Lista de comentários conforme filtro aplicado.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar comentários',
    description: 'Lista comentários com filtros por post, autor ou comentário pai',
  })
  @ApiQuery({ name: 'postId', required: false, description: 'Filtrar por ID do post', example: 'N-fGhgb8-2byjMUku8vkI' })
  @ApiQuery({ name: 'authorId', required: false, description: 'Filtrar por ID do autor', example: '44085408-7021-7051-e274-ae704499cd72' })
  @ApiQuery({ name: 'parentId', required: false, description: 'Filtrar por comentário pai (respostas)', example: 'O4gqlc5OagZr5HQClsYDU' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados', example: 10 })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação', example: 0 })
  @ApiResponse({
    status: 200,
    description: 'Lista de comentários retornada',
    type: ApiResponseDto,
  })
  findAll(@Query() query: {
    postId?: string;
    authorId?: string;
    parentId?: string;
    limit?: number;
    offset?: number;
  }) {
    if (query.postId) {
      return this.commentsService.getCommentsByPostId(query.postId, query);
    }
    if (query.authorId) {
      return this.commentsService.getCommentsByAuthorId(query.authorId, query);
    }
    if (query.parentId) {
      return this.commentsService.getReplies(query.parentId);
    }
    throw new BadRequestException('Must provide postId, authorId, or parentId');
  }

  /**
   * Busca um comentário pelo ID.
   *
   * @param {string} id ID do comentário.
   * @returns {unknown} Comentário encontrado.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar comentário por ID',
    description: 'Retorna um comentário específico pelo seu ID',
  })
  @ApiParam({ name: 'id', description: 'ID do comentário', example: 'O4gqlc5OagZr5HQClsYDU' })
  @ApiResponse({
    status: 200,
    description: 'Comentário encontrado',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Comentário não encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.commentsService.getCommentById(id);
  }

  /**
   * Atualiza um comentário.
   *
   * @param {string} id ID do comentário.
   * @param {UpdateCommentDto} dto Campos para atualização.
   * @returns {unknown} Comentário atualizado.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar comentário',
    description: 'Atualiza um comentário existente',
  })
  @ApiParam({ name: 'id', description: 'ID do comentário', example: 'O4gqlc5OagZr5HQClsYDU' })
  @ApiResponse({
    status: 200,
    description: 'Comentário atualizado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Comentário não encontrado',
  })
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto) {
    return this.commentsService.updateComment(id, dto);
  }

  /**
   * Remove um comentário.
   *
   * @param {string} id ID do comentário.
   * @returns {unknown} Resultado da remoção.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar comentário',
    description: 'Remove permanentemente um comentário',
  })
  @ApiParam({ name: 'id', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Comentário deletado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Comentário não encontrado',
  })
  remove(@Param('id') id: string) {
    return this.commentsService.deleteComment(id);
  }

  /**
   * Aprova um comentário (muda status para `APPROVED`).
   *
   * @param {string} id ID do comentário.
   * @returns {unknown} Resultado da operação.
   */
  @Post(':id/approve')
  @ApiOperation({
    summary: 'Aprovar comentário',
    description: 'Muda o status do comentário para APPROVED',
  })
  @ApiParam({ name: 'id', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Comentário aprovado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Comentário não encontrado',
  })
  approve(@Param('id') id: string) {
    return this.commentsService.approveComment(id);
  }

  /**
   * Rejeita um comentário (muda status para `REJECTED`).
   *
   * @param {string} id ID do comentário.
   * @returns {unknown} Resultado da operação.
   */
  @Post(':id/reject')
  @ApiOperation({
    summary: 'Rejeitar comentário',
    description: 'Muda o status do comentário para REJECTED',
  })
  @ApiParam({ name: 'id', description: 'ID do comentário' })
  @ApiResponse({
    status: 200,
    description: 'Comentário rejeitado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Comentário não encontrado',
  })
  reject(@Param('id') id: string) {
    return this.commentsService.rejectComment(id);
  }
}

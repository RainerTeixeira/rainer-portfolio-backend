// src/modules/blog/posts/posts.controller.ts

/**
 * @fileoverview
 * Controlador responsável por gerenciar operações relacionadas a posts do blog.
 * 
 * Este controlador expõe endpoints RESTful para criação, atualização, exclusão, busca e listagem de posts,
 * incluindo filtros por autor, categoria, popularidade e slug.
 * 
 * Cada rota está devidamente documentada com Swagger, facilitando a integração e o entendimento da API.
 * 
 * Funcionalidades principais:
 * - Criar um novo post
 * - Buscar post por ID ou slug
 * - Atualizar e excluir posts
 * - Listar posts por autor, categoria, popularidade e recentes
 * 
 * @module PostsController
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PostService } from '@src/modules/blog/posts/posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostEntity } from './post.entity';

/**
 * Controlador de Posts do Blog.
 * 
 * Gerencia todas as operações relacionadas a posts, incluindo criação, atualização, exclusão e consultas
 * por diferentes critérios (autor, categoria, popularidade, slug e recentes).
 */
@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  /**
   * Injeta o serviço de posts.
   * @param postService Serviço responsável pela lógica de negócios dos posts.
   */
  constructor(private readonly postService: PostService) { }

  /**
   * Cria um novo post.
   * @param createDto Dados para criação do post.
   * @returns O post criado.
   */
  @Post()
  @ApiOperation({ summary: 'Criar novo post' })
  @ApiBody({ type: CreatePostDto })
  @ApiResponse({ status: 201, description: 'Post criado com sucesso.', type: PostEntity })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(@Body() createDto: CreatePostDto): Promise<PostEntity> {
    return this.postService.create(createDto);
  }

  /**
   * Busca um post pelo seu ID.
   * @param id Identificador do post.
   * @returns O post encontrado.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obter post por ID' })
  @ApiParam({ name: 'id', type: String, description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post encontrado.', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async findById(@Param('id') id: string): Promise<PostEntity> {
    return this.postService.findById(id);
  }

  /**
   * Atualiza um post existente.
   * @param id Identificador do post.
   * @param updateDto Dados para atualização do post.
   * @returns O post atualizado.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar post' })
  @ApiParam({ name: 'id', type: String, description: 'ID do post a ser atualizado' })
  @ApiBody({ type: UpdatePostDto })
  @ApiResponse({ status: 200, description: 'Post atualizado com sucesso.', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return this.postService.update(id, updateDto);
  }

  /**
   * Exclui um post pelo seu ID.
   * @param id Identificador do post.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir post' })
  @ApiParam({ name: 'id', type: String, description: 'ID do post a ser excluído' })
  @ApiResponse({ status: 204, description: 'Post excluído com sucesso.' })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.postService.delete(id);
  }

  /**
   * Lista posts de um autor específico.
   * @param authorId Identificador do autor.
   * @param sort Ordem de classificação (ascendente ou descendente).
   * @returns Lista de posts do autor.
   */
  @Get('author/:authorId')
  @ApiOperation({ summary: 'Listar posts por autor' })
  @ApiParam({ name: 'authorId', type: String, description: 'ID do autor' })
  @ApiQuery({ name: 'sort', enum: ['asc', 'desc'], required: false, description: 'Ordem de classificação' })
  @ApiResponse({ status: 200, description: 'Lista de posts do autor.', type: [PostEntity] })
  async findPostsByAuthor(
    @Param('authorId') authorId: string,
    @Query('sort') sort: 'asc' | 'desc' = 'desc',
  ): Promise<PostEntity[]> {
    return this.postService.findPostsByAuthor(authorId, sort);
  }

  /**
   * Lista posts de uma categoria específica.
   * @param categoryId Identificador da categoria.
   * @returns Lista de posts da categoria.
   */
  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Listar posts por categoria' })
  @ApiParam({ name: 'categoryId', type: String, description: 'ID da categoria' })
  @ApiResponse({ status: 200, description: 'Lista de posts da categoria.', type: [PostEntity] })
  async findPostsByCategory(
    @Param('categoryId') categoryId: string,
  ): Promise<PostEntity[]> {
    return this.postService.findPostsByCategory(categoryId);
  }

  /**
   * Lista os posts mais recentes.
   * @param limit Limite de posts a serem retornados (padrão: 10).
   * @returns Lista de posts recentes.
   */
  @Get('recent/list')
  @ApiOperation({ summary: 'Listar posts recentes' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Limite de posts a serem retornados' })
  @ApiResponse({ status: 200, description: 'Lista de posts recentes.', type: [PostEntity] })
  async findRecentPosts(
    @Query('limit') limit = 10,
  ): Promise<PostEntity[]> {
    return this.postService.findRecentPosts(limit);
  }

  /**
   * Busca um post pelo seu slug.
   * @param slug Slug do post.
   * @returns O post encontrado.
   */
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Buscar post por slug' })
  @ApiParam({ name: 'slug', type: String, description: 'Slug do post' })
  @ApiResponse({ status: 200, description: 'Post encontrado.', type: PostEntity })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async findBySlug(@Param('slug') slug: string): Promise<PostEntity> {
    return this.postService.findBySlug(slug);
  }

  /**
   * Lista os posts mais populares de uma categoria.
   * @param categoryId Identificador da categoria.
   * @param limit Limite de posts a serem retornados (padrão: 10).
   * @returns Lista de posts populares da categoria.
   */
  @Get('category/:categoryId/popular')
  @ApiOperation({ summary: 'Posts populares por categoria' })
  @ApiParam({ name: 'categoryId', type: String, description: 'ID da categoria' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Limite de posts a serem retornados' })
  @ApiResponse({ status: 200, description: 'Lista de posts populares da categoria.', type: [PostEntity] })
  async findPopularByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit = 10,
  ): Promise<PostEntity[]> {
    return this.postService.findPopularByCategory(categoryId, limit);
  }
}
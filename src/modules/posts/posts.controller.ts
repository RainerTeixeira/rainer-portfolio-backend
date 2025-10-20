/**
 * Posts Controller
 * 
 * Controller NestJS para endpoints de posts.
 * Implementa rotas REST com validação e documentação Swagger.
 * 
 * @module modules/posts/posts.controller
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { PostsService } from './posts.service.js';
import type { CreatePostData, UpdatePostData } from './post.model.js';

/**
 * Controller de Posts
 * 
 * Rotas disponíveis:
 * - POST   /posts              - Criar post
 * - GET    /posts              - Listar posts (paginado)
 * - GET    /posts/:id          - Buscar post por ID
 * - GET    /posts/slug/:slug   - Buscar post por slug
 * - PUT    /posts/:id          - Atualizar post
 * - DELETE /posts/:id          - Deletar post
 * - PATCH  /posts/:id/publish  - Publicar post
 * - PATCH  /posts/:id/unpublish - Despublicar post
 * - GET    /posts/subcategory/:subcategoryId - Posts por subcategoria
 * - GET    /posts/author/:authorId - Posts por autor
 */
@ApiTags('📄 Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /**
   * Cria um novo post
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: '➕ Criar Post',
    description: 'Cria um novo post. O post DEVE pertencer a uma subcategoria (não categoria principal).'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Post criado com sucesso' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dados inválidos (conteúdo, subcategoria ou autor ausentes)' 
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Meu Primeiro Post' },
        slug: { type: 'string', example: 'meu-primeiro-post' },
        content: { type: 'string', example: 'Conteúdo completo do post em markdown...' },
        excerpt: { type: 'string', example: 'Resumo breve do post', nullable: true },
        subcategoryId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        authorId: { type: 'string', example: '507f1f77bcf86cd799439022' },
        coverImage: { type: 'string', example: 'https://image.url/cover.jpg', nullable: true },
        tags: { type: 'array', items: { type: 'string' }, example: ['tech', 'tutorial'], nullable: true },
        status: { type: 'string', example: 'DRAFT', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], nullable: true },
        featured: { type: 'boolean', example: false, nullable: true },
      },
      required: ['title', 'slug', 'content', 'subcategoryId', 'authorId'],
    },
  })
  async create(@Body() data: CreatePostData) {
    const post = await this.postsService.createPost(data);
    return { 
      success: true, 
      message: 'Post criado com sucesso',
      data: post 
    };
  }

  /**
   * Lista posts com paginação e filtros
   */
  @Get()
  @ApiOperation({ 
    summary: '📋 Listar Posts',
    description: 'Lista posts com paginação e filtros opcionais'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filtrar por status (DRAFT, PUBLISHED, etc)' })
  @ApiQuery({ name: 'subcategoryId', required: false, type: String, description: 'Filtrar por subcategoria' })
  @ApiQuery({ name: 'authorId', required: false, type: String, description: 'Filtrar por autor' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean, description: 'Filtrar posts em destaque' })
  async list(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('authorId') authorId?: string,
    @Query('featured') featured?: boolean,
  ) {
    const result = await this.postsService.listPosts({ 
      page, 
      limit, 
      status, 
      subcategoryId, 
      authorId, 
      featured 
    });
    return { success: true, ...result };
  }

  /**
   * Busca post por ID
   */
  @Get(':id')
  @ApiOperation({ 
    summary: '🔍 Buscar Post por ID',
    description: 'Busca um post específico e incrementa contador de views'
  })
  @ApiParam({ name: 'id', description: 'ID do post (MongoDB ObjectId)' })
  @ApiResponse({ status: 200, description: 'Post encontrado' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  async findById(@Param('id') id: string) {
    const post = await this.postsService.getPostById(id);
    return { success: true, data: post };
  }

  /**
   * Busca post por slug
   */
  @Get('slug/:slug')
  @ApiOperation({ 
    summary: '🔍 Buscar Post por Slug',
    description: 'Busca um post pelo slug SEO-friendly'
  })
  @ApiParam({ name: 'slug', description: 'Slug do post (ex: meu-primeiro-post)' })
  @ApiResponse({ status: 200, description: 'Post encontrado' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  async findBySlug(@Param('slug') slug: string) {
    const post = await this.postsService.getPostBySlug(slug);
    return { success: true, data: post };
  }

  /**
   * Lista posts por subcategoria
   */
  @Get('subcategory/:subcategoryId')
  @ApiOperation({ 
    summary: '📂 Posts por Subcategoria',
    description: 'Lista todos os posts publicados de uma subcategoria específica'
  })
  @ApiParam({ name: 'subcategoryId', description: 'ID da subcategoria' })
  async getBySubcategory(@Param('subcategoryId') subcategoryId: string) {
    const posts = await this.postsService.getPostsBySubcategory(subcategoryId);
    return { success: true, data: posts, count: posts.length };
  }

  /**
   * Lista posts por autor
   */
  @Get('author/:authorId')
  @ApiOperation({ 
    summary: '👤 Posts por Autor',
    description: 'Lista todos os posts de um autor específico'
  })
  @ApiParam({ name: 'authorId', description: 'ID do autor' })
  async getByAuthor(@Param('authorId') authorId: string) {
    const posts = await this.postsService.getPostsByAuthor(authorId);
    return { success: true, data: posts, count: posts.length };
  }

  /**
   * Atualiza um post
   */
  @Put(':id')
  @ApiOperation({ 
    summary: '✏️ Atualizar Post',
    description: 'Atualiza campos de um post existente'
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Post Atualizado' },
        content: { type: 'string', example: 'Novo conteúdo atualizado...' },
        excerpt: { type: 'string', example: 'Novo resumo', nullable: true },
        coverImage: { type: 'string', example: 'https://image.url/new-cover.jpg', nullable: true },
        tags: { type: 'array', items: { type: 'string' }, example: ['updated', 'tech'], nullable: true },
        featured: { type: 'boolean', example: true, nullable: true },
      },
    },
  })
  async update(@Param('id') id: string, @Body() data: UpdatePostData) {
    const post = await this.postsService.updatePost(id, data);
    return { 
      success: true, 
      message: 'Post atualizado com sucesso',
      data: post 
    };
  }

  /**
   * Deleta um post
   */
  @Delete(':id')
  @ApiOperation({ 
    summary: '🗑️ Deletar Post',
    description: 'Remove permanentemente um post do sistema'
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Post não encontrado' })
  async delete(@Param('id') id: string) {
    return await this.postsService.deletePost(id);
  }

  /**
   * Publica um post
   */
  @Patch(':id/publish')
  @ApiOperation({ 
    summary: '📢 Publicar Post',
    description: 'Muda status do post para PUBLISHED e define data de publicação'
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post publicado com sucesso' })
  async publish(@Param('id') id: string) {
    const post = await this.postsService.publishPost(id);
    return { 
      success: true, 
      message: 'Post publicado com sucesso',
      data: post 
    };
  }

  /**
   * Despublica um post
   */
  @Patch(':id/unpublish')
  @ApiOperation({ 
    summary: '📝 Despublicar Post',
    description: 'Muda status do post para DRAFT e remove data de publicação'
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({ status: 200, description: 'Post despublicado com sucesso' })
  async unpublish(@Param('id') id: string) {
    const post = await this.postsService.unpublishPost(id);
    return { 
      success: true, 
      message: 'Post despublicado com sucesso',
      data: post 
    };
  }
}

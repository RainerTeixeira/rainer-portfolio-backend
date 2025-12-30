/**
 * @fileoverview Controller de Posts
 *
 * Define as rotas HTTP relacionadas a posts do blog.
 *
 * Papel deste controller:
 * - Receber requisições HTTP e extrair parâmetros (`@Param`, `@Query`, `@Body`).
 * - Delegar regras de negócio para `PostsService`.
 * - Expor documentação Swagger via decorators `@ApiOperation`, `@ApiResponse`, etc.
 *
 * Observações:
 * - Este controller não implementa regra de negócio; ele apenas orquestra a chamada
 *   do service e retorna o resultado.
 *
 * @module modules/posts/controllers/posts.controller
 */

import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService?: PostsService) {}

  /**
   * Cria um novo post.
   *
   * @param {CreatePostDto} dto Dados necessários para criação do post.
   * @returns {unknown} Retorno do service, normalmente uma resposta padronizada.
   */
  @Post()
  @ApiOperation({
    summary: 'Criar novo post',
    description: 'Cria um novo post no blog. O post será criado com status DRAFT por padrão.',
  })
  @ApiResponse({
    status: 201,
    description: 'Post criado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  create(@Body() dto: CreatePostDto) {
    if (this.postsService?.createPost) {
      return this.postsService.createPost(dto);
    }
    return { success: false, message: 'PostsService not available' };
  }

  /**
   * Lista todos os posts com suporte a filtros e paginação.
   *
   * @param {object} query Parâmetros de consulta opcionais.
   * @returns {Promise<object>} Posts encontrados.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar posts',
    description: 'Retorna todos os posts com suporte a filtros e paginação',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status (DRAFT, PUBLISHED, ARCHIVED)', example: 'PUBLISHED' })
  @ApiQuery({ name: 'authorId', required: false, description: 'Filtrar por autor (cognitoSub)', example: '44085408-7021-7051-e274-ae704499cd72' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filtrar por categoria/subcategoria', example: 'QbXAdwXAgTsCxfEfZoa1e' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados (padrão: 10)', example: 10 })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginação (padrão: 0)', example: 0 })
  @ApiResponse({
    status: 200,
    description: 'Lista de posts retornada com sucesso',
    type: ApiResponseDto,
  })
  async findAll(@Query() query: {
    status?: string;
    authorId?: string;
    categoryId?: string;
    limit?: number | string;
    offset?: number | string;
    page?: number | string;
  }) {
    try {
      // Buscar diretamente via HTTP do DynamoDB Admin
      const response = await fetch('http://localhost:8001/tables/portfolio-backend-table-posts/items', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: any = await response.json();
      
      // Filtrar posts publicados se status for especificado
      let posts = data.Items || [];
      if (query.status) {
        posts = posts.filter((post: any) => post.status === query.status);
      }
      if (query.authorId) {
        posts = posts.filter((post: any) => post.authorId === query.authorId);
      }
      if (query.categoryId) {
        posts = posts.filter((post: any) => post.subcategoryId === query.categoryId);
      }
      
      // Aplicar paginação
      const limit = query.limit ? Number(query.limit) : 10;
      const page = query.page ? Number(query.page) : 1;
      const offset = (page - 1) * limit;
      
      const paginatedPosts = posts.slice(offset, offset + limit);
      
      return {
        success: true,
        message: 'Posts recuperados com sucesso',
        data: paginatedPosts,
        meta: {
          total: posts.length,
          page,
          limit,
          totalPages: Math.ceil(posts.length / limit)
        }
      };
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      return {
        success: false,
        message: 'Erro ao buscar posts',
        error: error.message
      };
    }
  }

  /**
   * Busca um post específico pelo ID.
   *
   * @param {string} id ID único do post.
   * @returns {unknown} Post encontrado.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar post por ID',
    description: 'Retorna um post específico pelo seu ID único',
  })
  @ApiParam({ name: 'id', description: 'ID do post', example: 'AmfYq9ckEHMOjaPq1jvEK' })
  @ApiResponse({
    status: 200,
    description: 'Post encontrado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  async findOne(@Param('id') id: string) {
    if (this.postsService?.getPostById) {
      return this.postsService.getPostById(id);
    }
    return { success: false, message: 'PostsService not available' };
  }

  /**
   * Busca um post pelo slug.
   *
   * @param {string} slug Slug do post.
   * @returns {unknown} Post encontrado.
   */
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Buscar post por slug',
    description: 'Retorna um post específico pelo seu slug (URL-friendly)',
  })
  @ApiParam({ name: 'slug', description: 'Slug do post', example: 'meu-artigo-interessante' })
  @ApiResponse({
    status: 200,
    description: 'Post encontrado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  async findBySlug(@Param('slug') slug: string) {
    if (this.postsService?.getPostBySlug) {
      return this.postsService.getPostBySlug(slug);
    }
    return { success: false, message: 'PostsService not available' };
  }

  /**
   * Atualiza um post existente.
   *
   * @param {string} id ID do post a ser atualizado.
   * @param {UpdatePostDto} dto Campos a serem atualizados.
   * @returns {unknown} Post atualizado.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar post',
    description: 'Atualiza dados de um post existente',
  })
  @ApiParam({ name: 'id', description: 'ID do post', example: 'AmfYq9ckEHMOjaPq1jvEK' })
  @ApiResponse({
    status: 200,
    description: 'Post atualizado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    if (this.postsService?.updatePost) {
      return this.postsService.updatePost(id, dto);
    }
    return { success: false, message: 'PostsService not available' };
  }

  /**
   * Remove um post.
   *
   * @param {string} id ID do post a ser removido.
   * @returns {void} Confirmação de remoção.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Remover post',
    description: 'Remove um post permanentemente',
  })
  @ApiParam({ name: 'id', description: 'ID do post', example: 'AmfYq9ckEHMOjaPq1jvEK' })
  @ApiResponse({
    status: 204,
    description: 'Post removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  remove(@Param('id') id: string) {
    if (this.postsService?.deletePost) {
      return this.postsService.deletePost(id);
    }
    return { success: false, message: 'PostsService not available' };
  }

  /**
   * Incrementa o contador de visualizações de um post.
   *
   * @param {string} id ID do post.
   * @returns {unknown} Post com views atualizadas.
   */
  @Post(':id/view')
  @ApiOperation({
    summary: 'Incrementar visualizações',
    description: 'Incrementa o contador de visualizações de um post',
  })
  @ApiParam({ name: 'id', description: 'ID do post', example: 'AmfYq9ckEHMOjaPq1jvEK' })
  @ApiResponse({
    status: 200,
    description: 'Visualização registrada com sucesso',
    type: ApiResponseDto,
  })
  incrementView(@Param('id') id: string) {
    if (this.postsService?.incrementViews) {
      return this.postsService.incrementViews(id);
    }
    return { success: false, message: 'PostsService not available' };
  }

  /**
   * Publica um post (muda status para PUBLISHED).
   *
   * @param {string} id ID do post.
   * @returns {unknown} Post publicado.
   */
  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publicar post',
    description: 'Altera o status do post para PUBLISHED',
  })
  @ApiParam({ name: 'id', description: 'ID do post', example: 'AmfYq9ckEHMOjaPq1jvEK' })
  @ApiResponse({
    status: 200,
    description: 'Post publicado com sucesso',
    type: ApiResponseDto,
  })
  publish(@Param('id') id: string) {
    if (this.postsService?.publishPost) {
      return this.postsService.publishPost(id);
    }
    return { success: false, message: 'PostsService not available' };
  }

  /**
   * Arquiva um post (muda status para ARCHIVED).
   *
   * @param {string} id ID do post.
   * @returns {unknown} Post arquivado.
   */
  @Post(':id/archive')
  @ApiOperation({
    summary: 'Arquivar post',
    description: 'Altera o status do post para ARCHIVED',
  })
  @ApiParam({ name: 'id', description: 'ID do post', example: 'AmfYq9ckEHMOjaPq1jvEK' })
  @ApiResponse({
    status: 200,
    description: 'Post arquivado com sucesso',
    type: ApiResponseDto,
  })
  archive(@Param('id') id: string) {
    if (this.postsService?.archivePost) {
      return this.postsService.archivePost(id);
    }
    return { success: false, message: 'PostsService not available' };
  }
}
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
  constructor(private readonly postsService: PostsService) {}

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
    return this.postsService.createPost(dto);
  }

  /**
   * Lista posts com suporte a filtros e paginação.
   *
   * @param {object} query Parâmetros de filtro/paginação.
   * @param {string} [query.status] Status do post (ex.: `DRAFT`, `PUBLISHED`, `ARCHIVED`).
   * @param {string} [query.authorId] Filtra por autor.
   * @param {string} [query.categoryId] Filtra por categoria.
   * @param {number} [query.limit] Limite de itens.
   * @param {number} [query.offset] Offset para paginação.
   * @returns {unknown} Lista paginada/filtrada conforme implementação do repositório.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar posts',
    description: 'Lista todos os posts com suporte a filtros e paginação',
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
    const limitRaw = query.limit;
    const offsetRaw = query.offset;
    const pageRaw = query.page;

    const limit = limitRaw !== undefined ? Number.parseInt(String(limitRaw), 10) : undefined;
    const offsetFromQuery = offsetRaw !== undefined ? Number.parseInt(String(offsetRaw), 10) : undefined;
    const page = pageRaw !== undefined ? Number.parseInt(String(pageRaw), 10) : undefined;

    const limitNum = typeof limit === 'number' && Number.isFinite(limit) ? limit : undefined;
    const offsetNum = typeof offsetFromQuery === 'number' && Number.isFinite(offsetFromQuery) ? offsetFromQuery : undefined;
    const pageNum = typeof page === 'number' && Number.isFinite(page) ? page : undefined;

    const computedOffset =
      offsetNum !== undefined ? offsetNum :
      pageNum !== undefined && limitNum !== undefined ? Math.max(0, (pageNum - 1) * limitNum) :
      undefined;

    const posts = await this.postsService.getAllPosts({
      status: query.status,
      authorId: query.authorId,
      categoryId: query.categoryId,
      limit: limitNum,
      offset: Number.isFinite(computedOffset) ? computedOffset : undefined,
    });

    return {
      success: true,
      message: 'Posts encontrados com sucesso',
      data: posts
    };
  }

  /**
   * Busca um post pelo seu identificador.
   *
   * @param {string} id ID único do post.
   * @returns {unknown} Post encontrado (ou indicação de não encontrado conforme service).
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar post por ID',
    description: 'Retorna um post específico pelo seu ID único',
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Post encontrado',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.postsService.getPostById(id);
  }

  /**
   * Busca um post pelo slug (identificador amigável na URL).
   *
   * @param {string} slug Slug do post.
   * @returns {unknown} Post encontrado (ou indicação de não encontrado conforme service).
   */
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Buscar post por slug',
    description: 'Retorna um post específico através do seu slug URL-friendly',
  })
  @ApiParam({ name: 'slug', description: 'Slug do post' })
  @ApiResponse({
    status: 200,
    description: 'Post encontrado',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.postsService.getPostBySlug(slug);
  }

  /**
   * Atualiza parcialmente um post existente.
   *
   * @param {string} id ID do post.
   * @param {UpdatePostDto} dto Campos a serem atualizados.
   * @returns {unknown} Resultado da atualização.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar post',
    description: 'Atualiza um post existente. Campos não fornecidos são mantidos.',
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Post atualizado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.updatePost(id, dto);
  }

  /**
   * Remove um post.
   *
   * @param {string} id ID do post.
   * @returns {unknown} Resultado da remoção.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar post',
    description: 'Remove permanentemente um post do blog',
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Post deletado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  remove(@Param('id') id: string) {
    return this.postsService.deletePost(id);
  }

  /**
   * Incrementa o contador de visualizações de um post.
   *
   * @param {string} id ID do post.
   * @returns {unknown} Resultado da operação.
   */
  @Post(':id/view')
  @ApiOperation({
    summary: 'Registrar visualização',
    description: 'Incrementa o contador de visualizações de um post',
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Visualização registrada com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  incrementView(@Param('id') id: string) {
    return this.postsService.incrementViewCount(id);
  }

  /**
   * Publica um post (altera status para `PUBLISHED`).
   *
   * @param {string} id ID do post.
   * @returns {unknown} Post após atualização de status.
   */
  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publicar post',
    description: 'Muda o status do post para PUBLISHED',
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Post publicado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  publish(@Param('id') id: string) {
    return this.postsService.publishPost(id);
  }

  /**
   * Arquiva um post (altera status para `ARCHIVED`).
   *
   * @param {string} id ID do post.
   * @returns {unknown} Post após atualização de status.
   */
  @Post(':id/archive')
  @ApiOperation({
    summary: 'Arquivar post',
    description: 'Muda o status do post para ARCHIVED',
  })
  @ApiParam({ name: 'id', description: 'ID do post' })
  @ApiResponse({
    status: 200,
    description: 'Post arquivado com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado',
  })
  archive(@Param('id') id: string) {
    return this.postsService.archivePost(id);
  }
}

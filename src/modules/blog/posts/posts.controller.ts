import {
  Controller, Get, Post, Patch, Delete, Query, Param,
  Body, UseInterceptors, UseGuards, HttpCode, HttpStatus,
  DefaultValuePipe, ParseIntPipe
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiOkResponse, ApiCreatedResponse,
  ApiQuery, ApiParam, ApiBearerAuth, ApiExtraModels, getSchemaPath
} from '@nestjs/swagger';
import { ResponseInterceptor } from '@src/common/interceptors/response.interceptor';
import { PostsService } from './posts.service';
import { PostCreateDto } from '@src/modules/blog/posts/dto/create-post.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/update-post.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/content-post.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/summary-post.dto';
import { PostFullDto } from '@src/modules/blog/posts/dto/full-post.dto'; import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';
import { PaginatedPostsResult } from '@src/blog/post/interfaces/paginated-posts.interface';

@ApiTags('Blog Posts')
@ApiBearerAuth()
@ApiExtraModels(PostSummaryDto, PostFullDto)
@Controller('/blog/posts')
@UseInterceptors(ResponseInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  /**
   * @operation GET /blog/posts
   * @description Lista paginada de posts com ordenação por data de publicação
   * @param {number} [limit=10] - Número de itens por página (1-100)
   * @param {string} [nextKey] - Token para próxima página (codificado em Base64)
   * @returns {PaginatedPostsResult} Lista paginada com metadados
   */
  @Get()
  @ApiOperation({
    summary: 'Listar Posts Paginados',
    description: 'Retorna posts paginados usando cursor-based pagination'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'nextKey', required: false, description: 'Token de paginação codificado' })
  @ApiOkResponse({
    description: 'Lista de posts recuperada com sucesso',
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedPostsResult) },
        {
          properties: {
            items: {
              type: 'array',
              items: { $ref: getSchemaPath(PostSummaryDto) }
            }
          }
        }
      ]
    }
  })
  async getPaginatedPosts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('nextKey') nextKey?: string
  ): Promise<PaginatedPostsResult> {
    return this.postsService.getPaginatedPosts(limit, nextKey);
  }

  /**
   * @operation GET /blog/posts/{slug}
   * @description Busca detalhes completos de um post pelo slug
   * @param {string} slug - Slug único do post (kebab-case)
   * @returns {PostFullDto} Detalhes completos do post
   */
  @Get(':slug')
  @ApiOperation({ summary: 'Buscar Post por Slug', description: 'Recupera todos os detalhes de um post' })
  @ApiParam({ name: 'slug', type: String, example: 'meu-post' })
  @ApiOkResponse({
    description: 'Detalhes do post',
    type: PostFullDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post não encontrado' })
  async getPostBySlug(@Param('slug') slug: string): Promise<PostFullDto> {
    return this.postsService.getPostBySlug(slug);
  }

  /**
   * @operation POST /blog/posts
   * @description Cria um novo post no blog (requer autenticação)
   * @param {PostCreateDto} postCreateDto - Dados para criação do post
   * @returns {PostFullDto} Post criado com dados completos
   */
  @Post()
  @UseGuards(CognitoAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Novo Post', description: 'Cria um novo post (requer autenticação)' })
  @ApiCreatedResponse({
    description: 'Post criado com sucesso',
    type: PostFullDto
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado' })
  async createPost(@Body() postCreateDto: PostCreateDto): Promise<PostFullDto> {
    return this.postsService.createPost(postCreateDto);
  }

  /**
   * @operation PATCH /blog/posts/{postId}
   * @description Atualiza parcialmente um post existente (requer autenticação)
   * @param {string} postId - ID único do post
   * @param {PostUpdateDto} postUpdateDto - Campos para atualização
   * @returns {PostFullDto} Post atualizado
   */
  @Patch(':postId')
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Atualizar Post', description: 'Atualiza um post existente' })
  @ApiParam({ name: 'postId', type: String, example: 'mbx9zi-1a3' })
  @ApiOkResponse({
    description: 'Post atualizado com sucesso',
    type: PostFullDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post não encontrado' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado' })
  async updatePost(
    @Param('postId') postId: string,
    @Body() postUpdateDto: PostUpdateDto
  ): Promise<PostFullDto> {
    return this.postsService.updatePost(postId, postUpdateDto);
  }

  /**
   * @operation DELETE /blog/posts/{postId}
   * @description Exclui permanentemente um post (requer autenticação)
   * @param {string} postId - ID único do post
   */
  @Delete(':postId')
  @UseGuards(CognitoAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir Post', description: 'Remove permanentemente um post' })
  @ApiParam({ name: 'postId', type: String, example: 'mbx9zi-1a3' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Post excluído com sucesso' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post não encontrado' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado' })
  async deletePost(@Param('postId') postId: string): Promise<void> {
    await this.postsService.deletePost(postId);
  }
}
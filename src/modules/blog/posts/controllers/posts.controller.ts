import {
  Controller, Get, Post, Patch, Delete,
  Query, Param, Body, UseInterceptors, UseGuards,
  DefaultValuePipe, ParseIntPipe, NotFoundException, BadRequestException
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiQuery,
  ApiParam, ApiBearerAuth, ApiOkResponse
} from '@nestjs/swagger';
import { ResponseInterceptor } from '@src/common/interceptors/response.interceptor';
import { PostsService } from '@src/modules/blog/posts/services/posts.service';
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { PostFullDto } from '@src/modules/blog/posts/dto/post-full.dto';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';

/**
 * PostsController - Controlador responsável pelas operações de manipulação de posts do blog.
 * Este controlador lida com a criação, atualização, exclusão e listagem de posts.
 */
@Controller('/blog/posts')
@UseInterceptors(ResponseInterceptor)
@ApiTags('Blog Posts')
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  /**
   * Retorna uma lista paginada de posts.
   * Utiliza paginação baseada em cursor, permitindo que os posts sejam carregados em partes.
   *
   * @param limit Número máximo de posts a serem retornados por vez (padrão: 10).
   * @param nextKey Chave para a próxima página de resultados (opcional).
   *
   * @returns Lista de posts com resumo.
   */
  @Get()
  @ApiOperation({
    summary: 'Lista paginada de posts',
    description: 'Retorna posts paginados independentemente da categoria e subcategoria'
  })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'nextKey', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Lista de posts retornada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos.' })
  @ApiOkResponse({ type: [PostSummaryDto] })
  async getPaginatedPosts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('nextKey') nextKey?: string,
  ): Promise<any> {
    const response = await this.postsService.getPaginatedPosts(limit, nextKey);

    // Retorna os dados conforme o formato esperado
    return {
      success: true,
      data: response.data,
      nextKey: response.nextKey,
      timestamp: new Date().toISOString(),
      path: `/blog/posts?limit=${limit}`,
      statusCode: 200,
    };
  }

  /**
   * Retorna os detalhes completos de um post, identificado pelo seu slug.
   *
   * @param slug Identificador único do post (slug).
   *
   * @returns Detalhes completos de um post.
   */
  @Get(':slug')
  @ApiOperation({ summary: 'Busca post completo por slug' })
  @ApiParam({ name: 'slug', type: String })
  @ApiOkResponse({ type: PostFullDto })
  async getPostBySlug(@Param('slug') slug: string) {
    const post = await this.postsService.getPostBySlug(slug);
    if (!post) {
      throw new NotFoundException(`Post com slug "${slug}" não encontrado`);
    }
    return post;
  }

  /**
   * Cria um novo post.
   * Requer autenticação via Cognito para validar o usuário.
   *
   * @param postCreateDto Dados necessários para criar o novo post.
   *
   * @returns O post criado com os dados completos.
   */
  @Post()
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Cria novo post' })
  @ApiResponse({ status: 201, type: PostContentDto })
  async createPost(@Body() postCreateDto: PostCreateDto) {
    return this.postsService.createPost(postCreateDto);
  }

  /**
   * Atualiza um post existente.
   * Requer autenticação via Cognito para validar o usuário.
   *
   * @param id Identificador único do post a ser atualizado.
   * @param postUpdateDto Dados para atualização do post.
   *
   * @returns O post atualizado com os dados completos.
   */
  @Patch(':id')
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Atualiza post existente' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: PostContentDto })
  async updatePost(
    @Param('id') id: string,
    @Body() postUpdateDto: PostUpdateDto
  ) {
    return this.postsService.updatePost(id, postUpdateDto);
  }

  /**
   * Exclui um post permanentemente.
   * Requer autenticação via Cognito para validar o usuário.
   *
   * @param id Identificador único do post a ser excluído.
   *
   * @returns Mensagem indicando o sucesso da exclusão.
   */
  @Delete(':id')
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Exclui post permanentemente' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Post excluído com sucesso' })
  async deletePost(@Param('id') id: string) {
    return this.postsService.deletePost(id);
  }
}

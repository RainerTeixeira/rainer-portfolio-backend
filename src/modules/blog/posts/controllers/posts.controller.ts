import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  ParseIntPipe,
  Query,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import {
  CreatePostDto,
  UpdatePostDto,
  PostDetailDto,
  PostSummaryDto,
  BlogSummaryDto,
  PostContentDto,
} from '../dto';
import { ResponseInterceptor } from '../../../../interceptors/response.interceptor';

@Controller('posts')
@UseInterceptors(ResponseInterceptor)
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) {}

  /**
   * Cria um novo post.
   *
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado como PostDetailDto.
   */
  @Post()
  async create(@Body() createPostDto: CreatePostDto): Promise<PostDetailDto> {
    try {
      return await this.postsService.createPost(createPostDto);
    } catch (error) {
      return this.handleError('Erro ao criar post', error);
    }
  }

  /**
   * Retorna os 20 posts mais recentes do blog.
   *
   * @returns Uma lista de resumos dos posts (PostSummaryDto).
   */
  @Get('blog')
  async findAllBlogPosts(): Promise<PostSummaryDto[]> {
    try {
      return await this.postsService.getLatestPosts();
    } catch (error) {
      return this.handleError('Erro ao listar posts do blog', error);
    }
  }

  /**
   * Listagem paginada de posts.
   *
   * @param page - Número da página.
   * @param limit - Limite de posts por página.
   * @returns Uma lista paginada de resumos dos posts e o total de posts.
   */
  @Get('blog/posts')
  async getPaginatedPosts(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10
  ): Promise<{ data: PostSummaryDto[]; total: number }> {
    try {
      return await this.postsService.getPaginatedPosts(page, limit);
    } catch (error) {
      return this.handleError('Erro ao listar posts paginados', error);
    }
  }

  /**
   * Busca de posts com filtros.
   *
   * @param query - Termo de busca.
   * @param categoryId - Identificador da categoria (opcional).
   * @returns Uma lista de resumos dos posts que correspondem aos filtros.
   */
  @Get('blog/search')
  async searchPosts(
    @Query('q') query: string,
    @Query('category') categoryId?: string
  ): Promise<PostSummaryDto[]> {
    try {
      return await this.postsService.searchPosts(query, categoryId);
    } catch (error) {
      return this.handleError('Erro ao buscar posts', error);
    }
  }

  /**
   * Busca o conteúdo completo de um post pelo slug.
   *
   * @param slug - Slug do post.
   * @returns O conteúdo completo do post com dados relacionados.
   */
  @Get('blog/:slug/full')
  async getFullPostContent(@Param('slug') slug: string): Promise<PostContentDto> {
    try {
      return await this.postsService.getFullPostContentBySlug(slug);
    } catch (error) {
      return this.handleError('Erro ao buscar conteúdo completo do post', error);
    }
  }

  /**
   * Busca um post pelo seu ID.
   *
   * @param postId - Identificador do post (validação com ParseUUIDPipe).
   * @returns O post encontrado como PostDetailDto.
   */
  @Get(':postId')
  async findOne(@Param('postId', ParseUUIDPipe) postId: string): Promise<PostDetailDto> {
    try {
      return await this.postsService.getPostById(postId);
    } catch (error) {
      return this.handleError('Erro ao buscar post', error);
    }
  }

  /**
   * Atualiza um post existente.
   *
   * @param postId - Identificador do post (validação com ParseUUIDPipe).
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado como PostDetailDto.
   */
  @Patch(':postId')
  async update(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() updatePostDto: UpdatePostDto
  ): Promise<PostDetailDto> {
    try {
      return await this.postsService.updatePost(postId, updatePostDto);
    } catch (error) {
      return this.handleError('Erro ao atualizar post', error);
    }
  }

  /**
   * Remove um post.
   *
   * @param postId - Identificador do post (validação com ParseUUIDPipe).
   */
  @Delete(':postId')
  async remove(@Param('postId', ParseUUIDPipe) postId: string): Promise<void> {
    try {
      await this.postsService.deletePost(postId);
      return;
    } catch (error) {
      return this.handleError('Erro ao remover post', error);
    }
  }

  /**
   * Manipula e loga erros ocorridos nos métodos do controlador.
   *
   * @param message - Mensagem de erro customizada.
   * @param error - Objeto de erro.
   * @returns Lança uma exceção HTTP com status apropriado.
   */
  private handleError(message: string, error: any): any {
    this.logger.error(`${message}: ${error.message}`, error.stack);

    if (error instanceof HttpException) {
      throw error;
    }

    const status =
      error instanceof NotFoundException
        ? HttpStatus.NOT_FOUND
        : HttpStatus.INTERNAL_SERVER_ERROR;

    throw new HttpException(message, status);
  }
}

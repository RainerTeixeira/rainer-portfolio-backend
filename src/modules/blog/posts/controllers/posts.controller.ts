import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import {
  PostCreateDto,
  PostUpdateDto,
  PostContentDto,
  PostSummaryDto,
} from '../dto';
import { ResponseInterceptor } from '../../../../interceptors/response.interceptor';

@Controller('posts')
@UseInterceptors(ResponseInterceptor)
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) { }

  /**
   * Método auxiliar para centralizar o tratamento de erros.
   */
  private async execute<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      this.logger.error(`${errorMessage}: ${error.message}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * GET /posts
   * Retorna uma lista paginada de posts no formato resumido (PostSummaryDto).
   * Por padrão, retorna 10 posts por página.
   * Aceita o query parameter ?page para navegação.
   */
  @Get()
  async getPosts(
    @Query('page', ParseIntPipe) page: number = 1,
  ): Promise<{ data: PostSummaryDto[]; total: number }> {
    const limit = 10; // Define limit here or in config
    return this.execute(
      () => this.postsService.getPaginatedPosts(page, limit),
      'Erro ao listar posts',
    );
  }

  /**
   * POST /posts
   * Cria um novo post utilizando PostCreateDto e retorna o post completo (PostContentDto).
   */
  @Post()
  async createPost(
    @Body() postCreateDto: PostCreateDto,
  ): Promise<PostContentDto> {
    return this.execute(
      () => this.postsService.createPost(postCreateDto),
      'Erro ao criar post',
    );
  }

  /**
   * GET /posts/slug/:slug
   * Retorna um post completo (PostContentDto) com base no slug.
   */
  @Get('slug/:slug')
  async getPostBySlug(
    @Param('slug') slug: string,
  ): Promise<PostContentDto> {
    return this.execute(
      () => this.postsService.getPostBySlug(slug),
      'Erro ao buscar post pelo slug',
    );
  }

  /**
   * PATCH /posts/:id
   * Permite atualização parcial dos dados do post utilizando PostUpdateDto.
   */
  @Patch(':id')
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() postUpdateDto: PostUpdateDto,
  ): Promise<PostContentDto> {
    return this.execute(
      () => this.postsService.updatePost(id, postUpdateDto),
      'Erro ao atualizar post',
    );
  }

  /**
   * DELETE /posts/:id
   * Remove o post pelo seu identificador.
   */
  @Delete(':id')
  async deletePost(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.execute(
      () => this.postsService.deletePost(id),
      'Erro ao remover post',
    );
  }
}
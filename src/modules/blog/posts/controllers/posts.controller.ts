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
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { ResponseInterceptor } from '../../../../interceptors/response.interceptor';

@Controller('blog/posts')
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
    this.logger.debug(`Executando operação: ${errorMessage}`);
    try {
      const result = await operation();
      this.logger.verbose(`Operação concluída com sucesso: ${errorMessage}`);
      return result;
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
   * GET /blog/posts
   * Retorna uma lista paginada de posts.
   */
  @Get()
  async getPosts(
    @Query('page', ParseIntPipe) page: number = 1,
  ): Promise<{ data: PostSummaryDto[]; total: number }> {
    const limit = 10;
    this.logger.debug(`Recebida requisição GET para listar posts. Página: ${page}`);
    return this.execute(
      () => this.postsService.getPaginatedPosts(page, limit),
      'Erro ao listar posts',
    );
  }

  /**
   * POST /blog/posts
   * Cria um novo post.
   */
  @Post()
  async createPost(
    @Body() postCreateDto: PostCreateDto,
  ): Promise<PostContentDto> {
    this.logger.debug(`Recebida requisição POST para criação de post`);
    return this.execute(
      () => this.postsService.createPost(postCreateDto),
      'Erro ao criar post',
    );
  }

  /**
   * GET /blog/posts/:slug
   * Retorna um post completo com base no slug.
   */
  @Get(':slug')
  async getPostBySlug(
    @Param('slug') slug: string,
  ): Promise<PostContentDto> {
    this.logger.debug(`Recebida requisição GET para post com slug: ${slug}`);
    return this.execute(
      () => this.postsService.getPostBySlug(slug),
      'Erro ao buscar post pelo slug',
    );
  }

  /**
   * PATCH /blog/posts/:id
   * Atualiza parcialmente um post.
   */
  @Patch(':id')
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() postUpdateDto: PostUpdateDto,
  ): Promise<PostContentDto> {
    this.logger.debug(`Recebida requisição PATCH para atualizar post ID: ${id}`);
    return this.execute(
      () => this.postsService.updatePost(id, postUpdateDto),
      'Erro ao atualizar post',
    );
  }

  /**
   * DELETE /blog/posts/:id
   * Remove um post.
   */
  @Delete(':id')
  async deletePost(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.debug(`Recebida requisição DELETE para remover post ID: ${id}`);
    return this.execute(
      () => this.postsService.deletePost(id),
      'Erro ao remover post',
    );
  }
}

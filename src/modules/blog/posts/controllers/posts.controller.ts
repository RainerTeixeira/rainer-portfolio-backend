// PostsController.ts
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
   * Executa uma operação e lida com erros.
   * @param operation - Função que realiza a operação.
   * @param errorMessage - Mensagem de erro a ser lançada em caso de falha.
   * @returns Resultado da operação.
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
   * Retorna uma listagem paginada de posts.
   * @param page - Número da página.
   * @returns Objeto com a lista de posts e o total de posts.
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
   * Cria um novo post.
   * @param postCreateDto - Dados para criação do post.
   * @returns O post criado como PostContentDto.
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
   * Retorna um post completo com base no slug.
   * @param slug - Slug do post.
   * @returns O post completo como PostContentDto.
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
   * Atualiza um post existente.
   * @param id - Identificador do post.
   * @param postUpdateDto - Dados para atualização do post.
   * @returns O post atualizado como PostContentDto.
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
   * Deleta um post.
   * @param id - Identificador do post.
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
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
  CanActivate,
  ExecutionContext,
  UseGuards,
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { ResponseInterceptor } from '../../../../interceptors/response.interceptor';

/**
 * Guard customizado para permitir somente os métodos HTTP especificados.
 */
class AllowedMethodGuard implements CanActivate {
  constructor(private allowedMethods: string[]) { }
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!this.allowedMethods.includes(request.method)) {
      throw new HttpException('Método HTTP não permitido', HttpStatus.METHOD_NOT_ALLOWED);
    }
    return true;
  }
}

@Controller('blog/posts')
@UseInterceptors(ResponseInterceptor)
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) { }

  /**
   * Executa uma operação e lida com erros, registrando informações detalhadas.
   *
   * @param operation - Função que realiza a operação.
   * @param operationDescription - Descrição da operação (usada em logs de sucesso).
   * @param errorMessage - Mensagem de erro a ser exibida e registrada.
   * @returns Resultado da operação.
   */
  private async execute<T>(
    operation: () => Promise<T>,
    operationDescription: string,
    errorMessage: string,
  ): Promise<T> {
    this.logger.debug(`Iniciando operação: ${operationDescription}`);
    try {
      const result = await operation();
      this.logger.verbose(`Operação concluída com sucesso: ${operationDescription}`);
      return result;
    } catch (error) {
      this.logger.error(`${errorMessage}: ${error?.message}`, error?.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        { message: errorMessage, originalError: error?.message },
        status,
      );
    }
  }

  /**
   * Retorna uma listagem paginada de posts.
   * Permite apenas requisições GET.
   * @param page - Número da página (padrão é 1).
   * @returns Objeto contendo a lista de posts e o total de posts.
   */
  @Get()
  @UseGuards(new AllowedMethodGuard(['GET']))
  async getPosts(
    @Query('page', ParseIntPipe) page: number = 1,
  ): Promise<{ data: PostSummaryDto[]; total: number }> {
    const limit = 10;
    this.logger.debug(`Recebida requisição GET para listar posts. Página: ${page}`);
    return this.execute(
      () => this.postsService.getPaginatedPosts(page, limit),
      'Listagem de posts',
      'Erro ao listar posts'
    );
  }

  /**
   * Cria um novo post.
   * Permite apenas requisições POST.
   * @param postCreateDto - Dados para criação do post.
   * @returns O post criado como PostContentDto.
   */
  @Post()
  @UseGuards(new AllowedMethodGuard(['POST']))
  async createPost(
    @Body() postCreateDto: PostCreateDto,
  ): Promise<PostContentDto> {
    this.logger.debug('Recebida requisição POST para criação de post');
    return this.execute(
      () => this.postsService.createPost(postCreateDto),
      'Criação de post',
      'Erro ao criar post'
    );
  }

  /**
   * Retorna um post completo com base no slug.
   * Permite apenas requisições GET.
   * @param slug - Slug do post.
   * @returns O post completo como PostContentDto.
   */
  @Get(':slug')
  @UseGuards(new AllowedMethodGuard(['GET']))
  async getPostBySlug(
    @Param('slug') slug: string,
  ): Promise<PostContentDto> {
    this.logger.debug(`Recebida requisição GET para post com slug: ${slug}`);
    return this.execute(
      () => this.postsService.getPostBySlug(slug),
      'Consulta de post por slug',
      'Erro ao buscar post pelo slug',
    );
  }

  /**
   * Atualiza um post existente.
   * Permite apenas requisições PATCH.
   * @param id - Identificador do post (UUID).
   * @param postUpdateDto - Dados para atualização do post.
   * @returns O post atualizado como PostContentDto.
   */
  @Patch(':id')
  @UseGuards(new AllowedMethodGuard(['PATCH']))
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() postUpdateDto: PostUpdateDto,
  ): Promise<PostContentDto> {
    this.logger.debug(`Recebida requisição PATCH para atualizar post ID: ${id}`);
    return this.execute(
      () => this.postsService.updatePost(id, postUpdateDto),
      'Atualização de post',
      'Erro ao atualizar post',
    );
  }

  /**
   * Deleta um post.
   * Permite apenas requisições DELETE.
   * @param id - Identificador do post (UUID).
   */
  @Delete(':id')
  @UseGuards(new AllowedMethodGuard(['DELETE']))
  async deletePost(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.debug(`Recebida requisição DELETE para remover post ID: ${id}`);
    return this.execute(
      () => this.postsService.deletePost(id),
      'Deleção de post',
      'Erro ao remover post',
    );
  }
}

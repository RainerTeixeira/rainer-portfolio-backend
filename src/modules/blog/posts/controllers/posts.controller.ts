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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

/**
 * Guard customizado para permitir somente os métodos HTTP especificados.
 * Isso ajuda a garantir que as rotas sejam usadas da maneira esperada, melhorando a segurança e potencialmente a performance ao evitar processamento desnecessário para métodos não permitidos.
 */
class AllowedMethodGuard implements CanActivate {
  constructor(private allowedMethods: string) { } // O construtor deve esperar um array de strings
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
@ApiTags('Posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) { }

  /**
   * Executa uma operação e lida com erros de forma centralizada, registrando informações detalhadas nos logs.
   * Garante que erros específicos (como NotFoundException) resultem nos códigos de status HTTP corretos.
   *
   * @param operation - Função assíncrona que realiza a operação a ser executada (ex: chamar um método do service).
   * @param operationDescription - Descrição da operação (usada em logs de sucesso).
   * @param errorMessage - Mensagem de erro genérica a ser exibida ao cliente em caso de falha inesperada.
   * @returns Uma Promise com o resultado da operação. Se ocorrer um erro, lança uma HttpException.
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
   * A paginação é otimizada para o DynamoDB utilizando o `nextKey` para consultas eficientes, o que é mais performático e adequado para o free tier, pois evita Scans completos.
   *
   * @param page - Número da página desejada (padrão é 1). Usado para calcular o `offset` inicial, mas a paginação real é baseada no `nextKey`.
   * @param limit - Número máximo de posts por página (padrão é 10). Controla a quantidade de dados retornados por consulta.
   * @param nextKey - Token de paginação opcional fornecido pela resposta anterior. Permite buscar a próxima página de resultados de forma eficiente.
   * @returns Objeto contendo a lista de posts resumidos, o total aproximado de posts, uma flag indicando se há mais posts (`hasMore`), o token para a próxima página (`nextKey`) e uma mensagem informativa.
   */
  @Get()
  @UseGuards(new AllowedMethodGuard(['GET']))
  @ApiOperation({ summary: 'Retorna uma listagem paginada de posts' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número da página desejada (padrão é 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Número máximo de posts por página (padrão é 10)' })
  @ApiQuery({ name: 'nextKey', required: false, type: String, description: 'Token de paginação opcional fornecido pela resposta anterior' })
  @ApiResponse({ status: 200, description: 'Listagem de posts retornada com sucesso.', type: [PostSummaryDto] })
  @ApiResponse({ status: 400, description: 'Erro ao listar posts paginados.' })
  async getPosts(
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 10,
    @Query('nextKey') nextKey?: string,
  ): Promise<{ data: PostSummaryDto; total: number; message?: string; hasMore: boolean; nextKey?: string }> {
    this.logger.debug(`Recebida requisição GET para listar posts. Página: ${page}, Limite: ${limit}, NextKey: ${nextKey}`);
    return this.execute(
      () => this.postsService.getPaginatedPosts(page, limit, nextKey),
      'Listagem paginada de posts',
      'Erro ao listar posts paginados'
    );
  }

  /**
   * Cria um novo post.
   * Permite apenas requisições POST.
   *
   * @param postCreateDto - Dados para criação do post no formato DTO.
   * @returns O post criado com todos os seus detalhes no formato DTO.
   */
  @Post()
  @UseGuards(new AllowedMethodGuard(['POST']))
  @ApiOperation({ summary: 'Cria um novo post' })
  @ApiResponse({ status: 201, description: 'Post criado com sucesso.', type: PostContentDto })
  @ApiResponse({ status: 400, description: 'Erro ao criar post.' })
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
   * Utiliza o índice secundário global `slug-index` para uma busca eficiente por slug, otimizando a performance e o uso de RCUs.
   *
   * @param slug - Slug único do post a ser buscado.
   * @returns O post completo com todos os seus detalhes no formato DTO. Lança NotFoundException se o post não for encontrado.
   */
  @Get(':slug')
  @UseGuards(new AllowedMethodGuard(['GET']))
  @ApiOperation({ summary: 'Retorna um post completo com base no slug' })
  @ApiParam({ name: 'slug', required: true, description: 'Slug único do post a ser buscado' })
  @ApiResponse({ status: 200, description: 'Post retornado com sucesso.', type: PostContentDto })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async getPostBySlug(
    @Param('slug') slug: string,
  ): Promise<PostContentDto> {
    this.logger.debug(`Recebida requisição GET para post com slug: ${slug}`);
    const post = await this.execute(
      () => this.postsService.getPostBySlug(slug),
      'Consulta de post por slug',
      'Erro ao buscar post pelo slug',
    );
    if (!post) {
      throw new NotFoundException(`Post com slug '${slug}' não encontrado`);
    }
    return post;
  }

  /**
   * Atualiza um post existente com base no ID.
   * Permite apenas requisições PATCH.
   *
   * @param id - Identificador único do post (UUID) a ser atualizado.
   * @param postUpdateDto - Dados para atualização do post no formato DTO.
   * @returns O post atualizado com todos os seus detalhes no formato DTO. Lança NotFoundException se o post não for encontrado.
   */
  @Patch(':id')
  @UseGuards(new AllowedMethodGuard(['PATCH']))
  @ApiOperation({ summary: 'Atualiza um post existente' })
  @ApiParam({ name: 'id', required: true, description: 'Identificador único do post (UUID) a ser atualizado' })
  @ApiResponse({ status: 200, description: 'Post atualizado com sucesso.', type: PostContentDto })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
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
   * Deleta um post com base no ID.
   * Permite apenas requisições DELETE.
   *
   * @param id - Identificador único do post (UUID) a ser deletado.
   * @returns Uma Promise que resolve quando o post é deletado com sucesso. Lança NotFoundException se o post não for encontrado.
   */
  @Delete(':id')
  @UseGuards(new AllowedMethodGuard(['DELETE']))
  @ApiOperation({ summary: 'Deleta um post' })
  @ApiParam({ name: 'id', required: true, description: 'Identificador único do post (UUID) a ser deletado' })
  @ApiResponse({ status: 200, description: 'Post deletado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
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
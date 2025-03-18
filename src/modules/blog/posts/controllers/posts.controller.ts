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
import { PostFullDto } from '@src/modules/blog/posts/dto/post-full.dto';
import { ResponseInterceptor } from '../../../../interceptors/response.interceptor';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';

/**
 * Guard customizado para permitir somente os métodos HTTP especificados.
 * 
 * Esse guard verifica se o método HTTP da requisição é um dos permitidos e, caso não seja, lança
 * uma exceção com status METHOD_NOT_ALLOWED.
 *
 * @class AllowedMethodGuard
 * @implements {CanActivate}
 */
class AllowedMethodGuard implements CanActivate {
  /**
   * Cria uma instância do guard com os métodos HTTP permitidos.
   * 
   * @param allowedMethods - String com os métodos HTTP permitidos (ex: 'GET', 'POST').
   */
  constructor(private allowedMethods: string[]) { }

  /**
   * Verifica se o método HTTP da requisição está entre os permitidos.
   *
   * @param context - Contexto de execução da requisição.
   * @returns {boolean} Retorna true se o método for permitido; caso contrário, lança uma exceção.
   * @throws {HttpException} Se o método HTTP não for permitido.
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!this.allowedMethods.includes(request.method)) {
      throw new HttpException('Método HTTP não permitido', HttpStatus.METHOD_NOT_ALLOWED);
    }
    return true;
  }
}

/**
 * Controller responsável pelo gerenciamento de posts.
 * 
 * Utiliza o interceptor ResponseInterceptor para padronizar as respostas e os decorators do
 * Swagger para documentar os endpoints e seus comportamentos. Alguns endpoints estão protegidos pelo
 * CognitoAuthGuard, garantindo que somente requisições autenticadas possam executar operações
 * sensíveis.
 */
@Controller('blog/posts')
@UseInterceptors(ResponseInterceptor)
@ApiTags('Posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  /**
   * Injeta o serviço de posts para realizar as operações de CRUD.
   * 
   * @param postsService - Serviço responsável pelas operações de posts.
   */
  constructor(private readonly postsService: PostsService) { }

  /**
   * Executa uma operação e lida com erros de forma centralizada, registrando informações detalhadas nos logs.
   * Garante que erros específicos (como NotFoundException) resultem nos códigos de status HTTP corretos.
   *
   * @template T
   * @param operation - Função assíncrona que realiza a operação (ex.: chamada de um método do service).
   * @param operationDescription - Descrição da operação para logs.
   * @param errorMessage - Mensagem de erro a ser exibida ao cliente em caso de falha.
   * @returns {Promise<T>} Resultado da operação.
   * @throws {HttpException} Em caso de erro na operação.
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
   * 
   * A paginação é otimizada para DynamoDB utilizando o `nextKey` para consultas eficientes.
   *
   * @param page - Número da página desejada (padrão é 1).
   * @param limit - Número máximo de posts por página (padrão é 10).
   * @param nextKey - Token de paginação opcional da consulta anterior.
   * @returns {Promise<Object>} Objeto contendo os posts resumidos, total aproximado, flag hasMore e token para a próxima página.
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
  ): Promise<{ data: PostSummaryDto[]; total: number; message?: string; hasMore: boolean; nextKey?: string }> {
    this.logger.debug(`Recebida requisição GET para listar posts. Página: ${page}, Limite: ${limit}, NextKey: ${nextKey}`);
    return this.execute(
      () => this.postsService.getPaginatedPosts(page, limit, nextKey),
      'Listagem paginada de posts',
      'Erro ao listar posts paginados'
    );
  }

  /**
   * Cria um novo post.
   *
   * Endpoint protegido pelo CognitoAuthGuard, permitindo apenas requisições autenticadas.
   *
   * @param postCreateDto - Dados para criação do post (DTO).
   * @returns {Promise<PostContentDto>} Post criado com seus detalhes.
   */
  @UseGuards(CognitoAuthGuard)
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
   * 
   * Utiliza o índice secundário global `slug-index` para uma busca otimizada.
   *
   * @param slug - Slug único do post a ser buscado.
   * @returns {Promise<PostFullDto>} Post completo com detalhes e entidades relacionadas.
   * @throws {NotFoundException} Se o post não for encontrado.
   */
  @Get(':slug')
  @UseGuards(new AllowedMethodGuard(['GET']))
  @ApiOperation({
    summary: 'Retorna um post completo com base no slug',
    description: 'Retorna o post completo incluindo informações do autor, categoria, subcategoria e comentários associados.'
  })
  @ApiParam({
    name: 'slug',
    required: true,
    description: 'Slug único do post a ser buscado',
    example: 'meu-post-exemplo'
  })
  @ApiResponse({
    status: 200,
    description: 'Post completo retornado com sucesso.',
    type: PostFullDto
  })
  @ApiResponse({
    status: 404,
    description: 'Post não encontrado.'
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno ao buscar post.'
  })
  async getPostBySlug(
    @Param('slug') slug: string,
  ): Promise<PostFullDto> {
    this.logger.debug(`Recebida requisição GET para post com slug: ${slug}`);
    return this.execute(
      () => this.postsService.getFullPostBySlug(slug),
      'Consulta completa de post por slug',
      'Erro ao buscar post completo'
    );
  }

  /**
   * Atualiza um post existente com base no ID.
   *
   * Endpoint protegido pelo CognitoAuthGuard, permitindo apenas requisições autenticadas.
   *
   * @param id - Identificador único do post (UUID) a ser atualizado.
   * @param postUpdateDto - Dados para atualização do post (DTO).
   * @returns {Promise<PostContentDto>} Post atualizado com seus detalhes.
   * @throws {NotFoundException} Se o post não for encontrado.
   */
  @UseGuards(CognitoAuthGuard)
  @Patch(':id')
  @UseGuards(new AllowedMethodGuard(['PATCH']))
  @ApiOperation({ summary: 'Atualiza um post existente' })
  @ApiParam({ name: 'id', required: true, description: 'Identificador único do post (UUID) a ser atualizado' })
  @ApiResponse({ status: 200, description: 'Post atualizado com sucesso.', type: PostContentDto })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async updatePost(
    @Param('id') id: string,
    @Body() postUpdateDto: PostUpdateDto,
  ): Promise<PostContentDto> {
    this.logger.debug(`Recebida requisição PATCH para atualizar post ID: ${id}`);
    this.logger.debug(`Dados recebidos para atualização: ${JSON.stringify(postUpdateDto)}`);
    return this.execute(
      () => this.postsService.updatePost(id, postUpdateDto),
      'Atualização de post',
      'Erro ao atualizar post',
    );
  }

  /**
   * Deleta um post com base no ID.
   *
   * Endpoint protegido pelo CognitoAuthGuard, permitindo apenas requisições autenticadas.
   *
   * @param id - Identificador único do post (UUID) a ser deletado.
   * @returns {Promise<Object>} Objeto contendo uma mensagem de sucesso.
   * @throws {NotFoundException} Se o post não for encontrado.
   */
  @UseGuards(CognitoAuthGuard)
  @Delete(':id')
  @UseGuards(new AllowedMethodGuard(['DELETE']))
  @ApiOperation({ summary: 'Deleta um post' })
  @ApiParam({ name: 'id', required: true, description: 'Identificador único do post (UUID) a ser deletado' })
  @ApiResponse({ status: 200, description: 'Post deletado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Post não encontrado.' })
  async deletePost(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    this.logger.debug(`Recebida requisição DELETE para remover post ID: ${id}`);
    return this.execute(
      () => this.postsService.deletePost(id),
      'Deleção de post',
      'Erro ao remover post',
    );
  }
}

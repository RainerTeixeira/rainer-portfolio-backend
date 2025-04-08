// src/modules/blog/posts/controllers/posts.controller.ts

import {
  Controller, Get, Post, Patch, Delete, HttpCode, // Adicionar HttpCode
  Query, Param, Body, UseInterceptors, UseGuards,
  DefaultValuePipe, ParseIntPipe, NotFoundException, HttpStatus // Adicionar HttpStatus
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiOkResponse, ApiCreatedResponse, // Usar respostas específicas
  ApiQuery, ApiParam, ApiBearerAuth, getSchemaPath // Importar getSchemaPath
} from '@nestjs/swagger';

// Importar a estrutura final da resposta para documentação Swagger
import { ApiSuccessResponseClass } from '@src/common/interceptors/response.interceptor';

import { ResponseInterceptor } from '@src/common/interceptors/response.interceptor';
import { PostsService, PaginatedPostsResult, SimpleSuccessMessage } from '@src/modules/blog/posts/services/posts.service'; // Importar tipos de retorno do service
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { PostFullDto } from '@src/modules/blog/posts/dto/post-full.dto';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard'; // Assumindo que está correto

/**
 * @controller PostsController
 * @description Ponto de entrada da API para gerenciar posts do blog.
 * Responsável por receber requisições HTTP, validar entradas, delegar a lógica para PostsService
 * e retornar os dados que serão formatados pelo ResponseInterceptor.
 *
 * @decorators
 * - `@Controller('/blog/posts')`: Define a rota base para este controller.
 * - `@UseInterceptors(ResponseInterceptor)`: Aplica o interceptor de resposta padrão a todos os endpoints.
 * - `@ApiTags('Blog Posts')`: Agrupa os endpoints na documentação Swagger.
 * - `@ApiBearerAuth()`: Indica que a autenticação Bearer (via CognitoAuthGuard) é esperada para endpoints protegidos.
 */
@Controller('/blog/posts') // Rota base mais específica
@UseInterceptors(ResponseInterceptor) // Aplica o interceptor a todas as rotas deste controller
@ApiTags('Blog Posts')
@ApiBearerAuth() // Assume que a maioria das rotas (ou todas) pode precisar de autenticação
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  /**
   * @endpoint GET /blog/posts
   * @description Retorna uma lista paginada de resumos de posts.
   * Ideal para listagens principais do blog. Não requer autenticação.
   * @query limit Número máximo de itens por página (padrão 10).
   * @query nextKey Cursor opaco (string base64) para buscar a próxima página.
   * @returns Estrutura `ApiSuccessResponse` contendo `PaginatedPostsResult` no campo `data`.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar Posts Paginados',
    description: 'Recupera uma lista de resumos de posts com suporte à paginação por cursor.'
  })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Itens por página', example: 10 })
  @ApiQuery({ name: 'nextKey', type: String, required: false, description: 'Cursor para a próxima página (formato Base64)' })
  @ApiOkResponse({
    description: 'Lista de posts recuperada com sucesso.',
    // Documenta a estrutura final da resposta, incluindo o wrapper do interceptor
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponseClass) }, // Referencia a estrutura base
        {
          properties: {
            data: { // Especifica o tipo dentro do 'data'
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: getSchemaPath(PostSummaryDto) } // Array do DTO de resumo
                },
                nextKey: {
                  type: 'string',
                  nullable: true,
                  description: 'Cursor para a próxima página ou null',
                  example: 'eyJJRCI6eyJTIjoibThuN3IxbWNiIn19'
                }
              }
            }
          }
        }
      ]
    }
  })
  async getPaginatedPosts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('nextKey') nextKey?: string,
  ): Promise<PaginatedPostsResult> { // Retorna o tipo definido no Service
    return this.postsService.getPaginatedPosts(limit, nextKey); // Retorna os dados brutos
  }

  /**
   * @endpoint GET /blog/posts/{slug}
   * @description Busca os detalhes completos de um post específico pelo seu slug.
   * Inclui conteúdo, autor, categoria, comentários, etc. Não requer autenticação.
   * @param slug Identificador único do post na URL.
   * @returns Estrutura `ApiSuccessResponse` contendo `PostFullDto` no campo `data`.
   * @throws NotFoundException (404) Se o post com o slug fornecido não for encontrado.
   */
  @Get(':slug')
  @ApiOperation({ summary: 'Buscar Post por Slug', description: 'Recupera todos os detalhes de um post usando seu slug único.' })
  @ApiParam({ name: 'slug', type: String, description: 'Slug único do post (kebab-case)', example: 'desvendando-cache-nestjs' })
  @ApiOkResponse({
    description: 'Detalhes do post recuperados com sucesso.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponseClass) },
        { properties: { data: { $ref: getSchemaPath(PostFullDto) } } } // O 'data' contém o PostFullDto
      ]
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post não encontrado.' }) // Documenta o 404
  async getPostBySlug(@Param('slug') slug: string): Promise<PostFullDto> { // Retorna o tipo definido no Service
    const post = await this.postsService.getPostBySlug(slug);
    return post; // Retorna os dados brutos
  }

  /**
   * @endpoint POST /blog/posts
   * @description Cria um novo post no blog. Requer autenticação.
   * @body postCreateDto Dados do post a ser criado.
   * @returns Estrutura `ApiSuccessResponse` contendo `PostContentDto` do post criado no campo `data`. Retorna status 201.
   * @throws BadRequestException (400) Se os dados de entrada forem inválidos ou ocorrer erro na criação.
   */
  @Post()
  @UseGuards(CognitoAuthGuard) // Protege a rota
  @HttpCode(HttpStatus.CREATED) // Define o status code de sucesso para 201
  @ApiOperation({ summary: 'Criar Novo Post', description: 'Adiciona um novo post ao blog (requer autenticação).' })
  @ApiCreatedResponse({ // Use ApiCreatedResponse para status 201
    description: 'Post criado com sucesso.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponseClass) },
        { properties: { data: { $ref: getSchemaPath(PostContentDto) } } } // O 'data' contém o PostContentDto
      ]
    }
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou erro na criação.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' }) // Documenta erro de autenticação
  async createPost(@Body() postCreateDto: PostCreateDto): Promise<PostContentDto> { // Retorna o tipo definido no Service
    return this.postsService.createPost(postCreateDto); // Retorna os dados brutos
  }

  /**
   * @endpoint PATCH /blog/posts/{id}
   * @description Atualiza parcialmente um post existente pelo seu ID. Requer autenticação.
   * @param id ID do post a ser atualizado.
   * @body postUpdateDto Campos do post a serem atualizados.
   * @returns Estrutura `ApiSuccessResponse` contendo `PostContentDto` do post atualizado no campo `data`.
   * @throws NotFoundException (404) Se o post com o ID não for encontrado.
   * @throws BadRequestException (400) Se os dados de entrada forem inválidos ou ocorrer erro na atualização.
   */
  @Patch(':id')
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Atualizar Post por ID', description: 'Modifica um post existente (requer autenticação).' })
  @ApiParam({ name: 'id', type: String, description: 'ID único do post', example: 'm87r1mcb' })
  @ApiOkResponse({
    description: 'Post atualizado com sucesso.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponseClass) },
        { properties: { data: { $ref: getSchemaPath(PostContentDto) } } } // O 'data' contém o PostContentDto
      ]
    }
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post não encontrado.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos ou erro na atualização.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  async updatePost(
    @Param('id') id: string,
    @Body() postUpdateDto: PostUpdateDto
  ): Promise<PostContentDto> { // Retorna o tipo definido no Service
    return this.postsService.updatePost(id, postUpdateDto); // Retorna os dados brutos
  }

  /**
   * @endpoint DELETE /blog/posts/{id}
   * @description Exclui permanentemente um post pelo seu ID. Requer autenticação.
   * @param id ID do post a ser excluído.
   * @returns Estrutura `ApiSuccessResponse` contendo um objeto com mensagem de sucesso no campo `data`. Retorna status 200 (ou 204 No Content).
   * @throws NotFoundException (404) Se o post com o ID não for encontrado.
   * @throws InternalServerErrorException (500) Se ocorrer um erro inesperado durante a exclusão.
   */
  @Delete(':id')
  @UseGuards(CognitoAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT) // Alternativa: Retornar 204 sem corpo na resposta
  @ApiOperation({ summary: 'Excluir Post por ID', description: 'Remove um post permanentemente (requer autenticação).' })
  @ApiParam({ name: 'id', type: String, description: 'ID único do post', example: 'm87r1mcb' })
  @ApiOkResponse({ // Se usar 200 OK com corpo
    description: 'Post excluído com sucesso.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiSuccessResponseClass) },
        {
          properties: {
            data: { // O 'data' contém um objeto simples de mensagem
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Post excluído com sucesso' }
              }
            }
          }
        }
      ]
    }
  })
  // @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Post excluído com sucesso (sem corpo).' }) // Se usar 204
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post não encontrado.' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Erro ao excluir o post.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Não autorizado.' })
  async deletePost(@Param('id') id: string): Promise<SimpleSuccessMessage> { // Retorna o tipo definido no Service
    return this.postsService.deletePost(id); // Retorna os dados brutos
  }
}
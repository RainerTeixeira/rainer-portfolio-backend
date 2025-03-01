import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Logger,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import {
  CreatePostDto,
  UpdatePostDto,
  PostDetailDto,
  PostSummaryDto,
} from '../dto'; // Importação correta das DTOs

@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) { }

  /**
   * Cria um novo post.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado como PostDetailDto.
   */
  @Post('categories/:categoryIdSubcategoryId/posts')
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Body() createPostDto: CreatePostDto
  ): Promise<PostDetailDto> {
    try {
      return await this.postsService.createPost(
        categoryIdSubcategoryId,
        createPostDto
      );
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
   * Busca um post do blog pelo seu ID.
   * Nota: Não é aplicado ParseUUIDPipe para o parâmetro postId nesta rota.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @returns O post encontrado como PostDetailDto.
   */
  @Get('blog/:categoryIdSubcategoryId/:postId')
  async findOneBlogPost(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string
  ): Promise<PostDetailDto> {
    try {
      return await this.postsService.getPostById(
        categoryIdSubcategoryId,
        postId
      );
    } catch (error) {
      return this.handleError('Erro ao buscar post', error);
    }
  }

  /**
   * Busca um post pelo seu ID.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post (validação com ParseUUIDPipe).
   * @returns O post encontrado como PostDetailDto.
   */
  @Get('categories/:categoryIdSubcategoryId/posts/:postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<PostDetailDto> {
    try {
      return await this.postsService.getPostById(
        categoryIdSubcategoryId,
        postId
      );
    } catch (error) {
      return this.handleError('Erro ao buscar post', error);
    }
  }

  /**
   * Atualiza um post existente.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post (validação com ParseUUIDPipe).
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado como PostDetailDto.
   */
  @Patch('categories/:categoryIdSubcategoryId/posts/:postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() updatePostDto: UpdatePostDto
  ): Promise<PostDetailDto> {
    try {
      return await this.postsService.updatePost(
        categoryIdSubcategoryId,
        postId,
        updatePostDto
      );
    } catch (error) {
      return this.handleError('Erro ao atualizar post', error);
    }
  }

  /**
   * Remove um post.
   *
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post (validação com ParseUUIDPipe).
   */
  @Delete('categories/:categoryIdSubcategoryId/posts/:postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<void> {
    try {
      await this.postsService.deletePost(categoryIdSubcategoryId, postId);
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

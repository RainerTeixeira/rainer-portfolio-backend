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
  NotFoundException
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto, UpdatePostDto, PostDetailDto, PostSummaryDto } from '../dto'; // <-- Importação correta das DTOs

@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) { }

  /**
   * Cria um novo post.
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado.
   */
  @Post('categories/:categoryIdSubcategoryId/posts')
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Body() createPostDto: CreatePostDto // <-- Usando CreatePostDto para o Body
  ): Promise<PostDetailDto> { // <-- Retornando Promise<PostDetailDto>
    try {
      return await this.postsService.createPost(categoryIdSubcategoryId, createPostDto);
    } catch (error) {
      return this.handleError('Erro ao criar post', error);
    }
  }

  /**
   * Busca todos os posts do blog.
   * @returns Uma lista de resumos dos posts.
   */
  @Get('blog')
  async findAllBlogPosts(): Promise<PostSummaryDto[]> { // <-- Retornando Promise<PostSummaryDto[]>
    try {
      return await this.postsService.getLatestPosts();
    } catch (error) {
      return this.handleError('Erro ao listar posts do blog', error);
    }
  }

  /**
   * Busca um post do blog pelo seu ID.
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @returns O post encontrado.
   */
  @Get('blog/:categoryIdSubcategoryId/:postId')
  async findOneBlogPost(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<PostDetailDto> { // <-- Retornando Promise<PostDetailDto>
    try {
      return await this.postsService.getFullPostById(categoryIdSubcategoryId, postId);
    } catch (error) {
      return this.handleError('Erro ao buscar post', error);
    }
  }

  /**
   * Busca um post pelo seu ID.
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @returns O post encontrado.
   */
  @Get('categories/:categoryIdSubcategoryId/posts/:postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<PostDetailDto> { // <-- Retornando Promise<PostDetailDto>
    try {
      return await this.postsService.getPostById(categoryIdSubcategoryId, postId);
    } catch (error) {
      return this.handleError('Erro ao buscar post', error);
    }
  }

  /**
   * Atualiza um post existente.
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado.
   */
  @Patch('categories/:categoryIdSubcategoryId/posts/:postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() updatePostDto: UpdatePostDto // <-- Usando UpdatePostDto para o Body
  ): Promise<PostDetailDto> { // <-- Retornando Promise<PostDetailDto>
    try {
      return await this.postsService.updatePost(categoryIdSubcategoryId, postId, updatePostDto);
    } catch (error) {
      return this.handleError('Erro ao atualizar post', error);
    }
  }

  /**
   * Remove um post.
   * @param categoryIdSubcategoryId - Identificador da categoria e subcategoria.
   * @param postId - Identificador do post.
   */
  @Delete('categories/:categoryIdSubcategoryId/posts/:postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<void> { // <-- Retornando Promise<void>
    try {
      await this.postsService.deletePost(categoryIdSubcategoryId, postId);
      return; // Retorno explícito de void
    } catch (error) {
      return this.handleError('Erro ao remover post', error);
    }
  }

  /**
   * Manipula erros lançados pelos métodos do controlador.
   * @param message - Mensagem de erro.
   * @param error - Objeto de erro.
   * @returns Lança uma exceção HTTP.
   */
  private handleError(message: string, error: any): any {
    this.logger.error(`${message}: ${error.message}`, error.stack);

    if (error instanceof HttpException) {
      throw error;
    }

    const status = error instanceof NotFoundException
      ? HttpStatus.NOT_FOUND
      : HttpStatus.INTERNAL_SERVER_ERROR;

    throw new HttpException(message, status);
  }
}
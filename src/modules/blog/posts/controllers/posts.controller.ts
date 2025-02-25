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
  HttpStatus
} from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto, UpdatePostDto, PostDto, FullPostDto } from '@src/modules/blog/posts/dto';

@Controller()
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) { }

  /**
   * Cria um novo post em uma categoria/subcategoria específica.
   * @param categoryIdSubcategoryId - ID da categoria/subcategoria.
   * @param createPostDto - Dados para criação do post.
   * @returns O post criado.
   */
  @Post('categories/:categoryIdSubcategoryId/posts')
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Body() createPostDto: CreatePostDto
  ): Promise<PostDto> {
    try {
      return await this.postsService.createPost(categoryIdSubcategoryId, createPostDto);
    } catch (error) {
      this.handleError('Erro ao criar post', error);
    }
  }

  /**
   * Retorna todos os posts do blog.
   * @returns Lista de posts completos do blog.
   */
  @Get('blog')
  async findAllBlogPosts(): Promise<FullPostDto[]> {
    try {
      return await this.postsService.getAllPosts();
    } catch (error) {
      this.handleError('Erro ao listar posts do blog', error);
    }
  }

  /**
   * Retorna um post específico do blog.
   * @param categoryIdSubcategoryId - ID da categoria/subcategoria.
   * @param postId - ID do post.
   * @returns O post completo.
   */
  @Get('blog/:categoryIdSubcategoryId/:postId')
  async findOneBlogPost(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<FullPostDto> {
    try {
      return await this.postsService.getFullPostById(categoryIdSubcategoryId, postId);
    } catch (error) {
      this.handleError('Erro ao buscar post', error);
    }
  }

  /**
   * Retorna todos os posts de uma categoria/subcategoria específica.
   * @param categoryIdSubcategoryId - ID da categoria/subcategoria.
   * @returns Lista de posts.
   */
  @Get('categories/:categoryIdSubcategoryId/posts')
  async findAll(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string
  ): Promise<PostDto[]> {
    try {
      return await this.postsService.getAllPosts(categoryIdSubcategoryId);
    } catch (error) {
      this.handleError('Erro ao buscar posts da categoria', error);
    }
  }

  /**
   * Retorna um post específico de uma categoria/subcategoria.
   * @param categoryIdSubcategoryId - ID da categoria/subcategoria.
   * @param postId - ID do post.
   * @returns O post.
   */
  @Get('categories/:categoryIdSubcategoryId/posts/:postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<PostDto> {
    try {
      return await this.postsService.getPostById(categoryIdSubcategoryId, postId);
    } catch (error) {
      this.handleError('Erro ao buscar post', error);
    }
  }

  /**
   * Atualiza um post específico de uma categoria/subcategoria.
   * @param categoryIdSubcategoryId - ID da categoria/subcategoria.
   * @param postId - ID do post.
   * @param updatePostDto - Dados para atualização do post.
   * @returns O post atualizado.
   */
  @Patch('categories/:categoryIdSubcategoryId/posts/:postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() updatePostDto: UpdatePostDto
  ): Promise<PostDto> {
    try {
      return await this.postsService.updatePost(categoryIdSubcategoryId, postId, updatePostDto);
    } catch (error) {
      this.handleError('Erro ao atualizar post', error);
    }
  }

  /**
   * Remove um post específico de uma categoria/subcategoria.
   * @param categoryIdSubcategoryId - ID da categoria/subcategoria.
   * @param postId - ID do post.
   */
  @Delete('categories/:categoryIdSubcategoryId/posts/:postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<void> {
    try {
      await this.postsService.deletePost(categoryIdSubcategoryId, postId);
    } catch (error) {
      this.handleError('Erro ao remover post', error);
    }
  }

  /**
   * Manipula erros lançados durante as operações do controlador.
   * @param message - Mensagem de erro.
   * @param error - Objeto de erro.
   */
  private handleError(message: string, error: any) {
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
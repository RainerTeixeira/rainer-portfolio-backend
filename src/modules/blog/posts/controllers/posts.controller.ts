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
import { CreatePostDto, UpdatePostDto, PostDetailDto, PostSummaryDto } from '@src/modules/blog/posts/dto';

@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) { }

  @Post('categories/:categoryIdSubcategoryId/posts')
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Body() createPostDto: CreatePostDto
  ): Promise<PostDetailDto> {
    try {
      return await this.postsService.createPost(categoryIdSubcategoryId, createPostDto);
    } catch (error) {
      return this.handleError('Erro ao criar post', error);
    }
  }

  @Get('blog')
  async findAllBlogPosts(): Promise<PostSummaryDto[]> {
    try {
      return await this.postsService.getLatestPosts();
    } catch (error) {
      return this.handleError('Erro ao listar posts do blog', error);
    }
  }

  @Get('blog/:categoryIdSubcategoryId/:postId')
  async findOneBlogPost(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<PostDetailDto> { // Mantido como PostDetailDto
    try {
      return await this.postsService.getFullPostById(categoryIdSubcategoryId, postId);
    } catch (error) {
      return this.handleError('Erro ao buscar post', error);
    }
  }

  @Get('categories/:categoryIdSubcategoryId/posts/:postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<PostDetailDto> {
    try {
      return await this.postsService.getPostById(categoryIdSubcategoryId, postId);
    } catch (error) {
      return this.handleError('Erro ao buscar post', error);
    }
  }

  @Patch('categories/:categoryIdSubcategoryId/posts/:postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() updatePostDto: UpdatePostDto
  ): Promise<PostDetailDto> {
    try {
      return await this.postsService.updatePost(categoryIdSubcategoryId, postId, updatePostDto);
    } catch (error) {
      return this.handleError('Erro ao atualizar post', error);
    }
  }

  @Delete('categories/:categoryIdSubcategoryId/posts/:postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId', ParseUUIDPipe) postId: string
  ): Promise<void> {
    try {
      await this.postsService.deletePost(categoryIdSubcategoryId, postId);
      return; // Adicionado retorno vazio (void)
    } catch (error) {
      return this.handleError('Erro ao remover post', error);
    }
  }

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
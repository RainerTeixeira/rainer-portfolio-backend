import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  CacheInterceptor,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreatePostDto,
  UpdatePostDto,
  PostDetailDto,
  BlogSummaryDto,
  PostContentDto,
  PostOperationResponseDto,
} from '../dto';
import { PostsService } from '@src/modules/blog/posts/services/posts.service.ts';
import { CacheClear } from '@src/common/decorators/cache-clear.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Blog Posts')
@Controller('blog')
@UseInterceptors(CacheInterceptor)
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post('posts')
  @HttpCode(HttpStatus.CREATED)
  @CacheClear(['blog_summary', 'latest_posts'])
  @ApiOperation({ summary: 'Cria um novo post' })
  @ApiResponse({ status: 201, type: PostOperationResponseDto })
  async createPost(
    @Body() createPostDto: CreatePostDto
  ): Promise<PostOperationResponseDto> {
    try {
      const post = await this.postsService.createPost(createPostDto);
      return { success: true, data: post };
    } catch (error) {
      throw new BadRequestException({ success: false, error: error.message });
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtém o resumo do blog' })
  @ApiResponse({ status: 200, type: BlogSummaryDto })
  async getBlogSummary(): Promise<BlogSummaryDto> {
    return this.postsService.getBlogSummary();
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Obtém um post completo por ID' })
  @ApiResponse({ status: 200, type: PostContentDto })
  async getFullPost(
    @Param('id') postId: string
  ): Promise<PostContentDto> {
    try {
      return await this.postsService.getFullPostContent(postId);
    } catch (error) {
      throw new NotFoundException('Post não encontrado');
    }
  }

  @Get('categoria/:categoryId')
  @ApiOperation({ summary: 'Lista posts por categoria' })
  @ApiResponse({ status: 200, type: [PostSummaryDto] })
  async getPostsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ): Promise<PostSummaryDto[]> {
    return this.postsService.getPostsByCategory(categoryId, page, limit);
  }

  @Get('subcategoria/:subcategoryId')
  @ApiOperation({ summary: 'Lista posts por subcategoria' })
  @ApiResponse({ status: 200, type: [PostSummaryDto] })
  async getPostsBySubcategory(
    @Param('subcategoryId') subcategoryId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ): Promise<PostSummaryDto[]> {
    return this.postsService.getPostsBySubcategory(subcategoryId, page, limit);
  }

  @Put('posts/:id')
  @CacheClear(['blog_summary', 'latest_posts', 'post_*'])
  @ApiOperation({ summary: 'Atualiza um post existente' })
  @ApiResponse({ status: 200, type: PostOperationResponseDto })
  async updatePost(
    @Param('id') postId: string,
    @Body() updatePostDto: UpdatePostDto
  ): Promise<PostOperationResponseDto> {
    try {
      const post = await this.postsService.updatePost(postId, updatePostDto);
      return { success: true, data: post };
    } catch (error) {
      throw new BadRequestException({ success: false, error: error.message });
    }
  }

  @Delete('posts/:id')
  @CacheClear(['blog_summary', 'latest_posts', 'post_*'])
  @ApiOperation({ summary: 'Remove um post' })
  @ApiResponse({ status: 200, type: PostOperationResponseDto })
  async deletePost(
    @Param('id') postId: string
  ): Promise<PostOperationResponseDto> {
    try {
      await this.postsService.deletePost(postId);
      return { success: true };
    } catch (error) {
      throw new BadRequestException({ success: false, error: error.message });
    }
  }
}
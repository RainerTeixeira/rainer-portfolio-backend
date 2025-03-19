// posts.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Query, Param, Body, UseInterceptors, UseGuards,
  DefaultValuePipe, ParseIntPipe // IMPORTE OS PIPES FALTANTES
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiQuery,
  ApiParam, ApiBearerAuth, ApiOkResponse
} from '@nestjs/swagger';
import { ResponseInterceptor } from '@src/common/interceptors/response.interceptor';
import { PostsService } from '@src/modules/blog/posts/services/posts.service';
import { PostCreateDto } from '@src/modules/blog/posts/dto/post-create.dto';
import { PostUpdateDto } from '@src/modules/blog/posts/dto/post-update.dto';
import { PostContentDto } from '@src/modules/blog/posts/dto/post-content.dto';
import { PostSummaryDto } from '@src/modules/blog/posts/dto/post-summary.dto';
import { PostFullDto } from '@src/modules/blog/posts/dto/post-full.dto';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';

@Controller('blog/posts')
@UseInterceptors(ResponseInterceptor)
@ApiTags('Blog Posts')
@ApiBearerAuth()
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Get()
  @ApiOperation({
    summary: 'Lista paginada de posts',
    description: 'Retorna posts paginados usando cursor-based pagination'
  })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'nextKey', type: String, required: false })
  @ApiOkResponse({ type: [PostSummaryDto] })
  async getPosts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('nextKey') nextKey?: string
  ) {
    return this.postsService.getPaginatedPosts(limit, nextKey);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Busca post completo por slug' })
  @ApiParam({ name: 'slug', type: String })
  @ApiOkResponse({ type: PostFullDto })
  async getPostBySlug(@Param('slug') slug: string) {
    return this.postsService.getFullPostBySlug(slug);
  }

  @Post()
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Cria novo post' })
  @ApiResponse({ status: 201, type: PostContentDto })
  async createPost(@Body() postCreateDto: PostCreateDto) {
    return this.postsService.createPost(postCreateDto);
  }

  @Patch(':id')
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Atualiza post existente' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: PostContentDto })
  async updatePost(
    @Param('id') id: string,
    @Body() postUpdateDto: PostUpdateDto
  ) {
    return this.postsService.updatePost(id, postUpdateDto);
  }

  @Delete(':id')
  @UseGuards(CognitoAuthGuard)
  @ApiOperation({ summary: 'Exclui post permanentemente' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Post excluído com sucesso' })
  async deletePost(@Param('id') id: string) {
    return this.postsService.deletePost(id);
  }
}
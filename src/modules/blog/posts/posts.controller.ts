import { Controller, Get, Post, Body, Put, Param, Delete, ValidationPipe, Query } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostDto } from './dto/post.dto';

@Controller('blog/posts') // Rota base para posts
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  async create(@Body(new ValidationPipe()) createPostDto: CreatePostDto): Promise<PostDto> {
    return this.postsService.create(createPostDto);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ): Promise<{ data: PostDto[]; total: number; page: number; limit: number }> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.postsService.findAllPaginated(pageNumber, limitNumber); // Exemplo de paginação
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PostDto> {
    return this.postsService.findOne(+id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe()) updatePostDto: UpdatePostDto,
  ): Promise<PostDto> {
    return this.postsService.update(+id, updatePostDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.postsService.remove(+id);
  }
}
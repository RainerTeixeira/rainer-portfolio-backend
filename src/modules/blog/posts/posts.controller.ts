import { Controller, Get, Post as HttpPost, Put, Delete, Body, Param } from '@nestjs/common';
import { PostService } from './post.service';
import { CategoryService } from './category.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostEntity } from './post.entity';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) { }

  @HttpPost()
  async create(@Body() createDto: CreatePostDto): Promise<PostEntity> {
    return await this.postService.create(createDto);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<PostEntity> {
    return await this.postService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePostDto,
  ): Promise<PostEntity> {
    return await this.postService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return await this.postService.delete(id);
  }

  @Get('author/:authorId')
  async findPostsByAuthor(@Param('authorId') authorId: string): Promise<PostEntity[]> {
    return await this.postService.findPostsByAuthor(authorId);
  }

  @Get('category/:categoryId')
  async findPostsByCategory(@Param('categoryId') categoryId: string): Promise<PostEntity[]> {
    return await this.postService.findPostsByCategory(categoryId);
  }

  @Get('recent/list')
  async findRecentPosts(): Promise<PostEntity[]> {
    return await this.postService.findRecentPosts();
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<PostEntity> {
    return await this.postService.findBySlug(slug);
  }
}

export class CategoryController {
}

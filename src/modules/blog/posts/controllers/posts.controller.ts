// src/modules/blog/posts/controllers/posts.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'; // Importa decorators do NestJS para controllers.
import { PostsService } from '@src/modules/blog/posts/services/posts.service'; // Importa PostsService usando alias @src.
import { CreatePostDto } from '@src/modules/blog/posts/dto/create-post.dto'; // Importa CreatePostDto usando alias @src.
import { UpdatePostDto } from '@src/modules/blog/posts/dto/update-post.dto'; // Importa UpdatePostDto usando alias @src.
import { PostDto } from '@src/modules/blog/posts/dto/post.dto'; // Importa PostDto usando alias @src.

@Controller('blog/posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  async create(@Body() createPostDto: CreatePostDto): Promise<PostDto> {
    return this.postsService.create(createPostDto);
  }

  @Get()
  async findAll(): Promise<PostDto[]> {
    return this.postsService.findAll();
  }

  @Get(':categoryIdSubcategoryId/:postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<PostDto> {
    return this.postsService.findOne(categoryIdSubcategoryId, postId);
  }

  @Put(':categoryIdSubcategoryId/:postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDto> {
    return this.postsService.update(categoryIdSubcategoryId, postId, updatePostDto);
  }

  @Delete(':categoryIdSubcategoryId/:postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    return this.postsService.remove(categoryIdSubcategoryId, postId);
  }
}
// src/modules/blog/posts/controllers/posts.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';

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
// src/modules/blog/posts/controllers/posts.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';

@Controller('categories/:categoryIdSubcategoryId/posts') // Rota base para posts dentro de categorias
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Post()
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostDto> {
    return this.postsService.createPost(categoryIdSubcategoryId, createPostDto); // Correção: createPost
  }

  @Get()
  async findAll(): Promise<PostDto[]> {
    return this.postsService.getAllPosts(); // Correção: getAllPosts
  }

  @Get(':postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<PostDto> {
    return this.postsService.getPostById(categoryIdSubcategoryId, postId); // Correção: getPostById
  }

  @Patch(':postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDto> {
    return this.postsService.updatePost(categoryIdSubcategoryId, postId, updatePostDto); // Correção: updatePost
  }

  @Delete(':postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    return this.postsService.deletePost(categoryIdSubcategoryId, postId); // Correção: deletePost
  }
}
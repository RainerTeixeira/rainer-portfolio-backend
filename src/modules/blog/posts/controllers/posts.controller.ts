// src/modules/blog/posts/controllers/posts.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Logger } from '@nestjs/common';
import { PostsService } from '../services/posts.service'; // Ensure correct path to PostsService
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';
import { FullPostDto } from '../dto/full-post.dto';

/**
 * @Controller PostsController
 * @description Controller for managing blog posts.
 * Defines endpoints for creating, retrieving, updating, and deleting posts.
 * This controller handles requests related to posts within categories/subcategories
 * and general blog post listings.
 */
@Controller() // Base route for this controller (can be adjusted if needed)
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  /**
   * @constructor
   * @param {PostsService} postsService - Injects the PostsService dependency.
   * @description Constructor for PostsController, injecting the PostsService.
   */
  constructor(private readonly postsService: PostsService) { } // Inject PostsService

  /**
   * @Post categories/:categoryIdSubcategoryId/posts
   * @description Endpoint to create a new post within a specific category/subcategory.
   * @param {string} categoryIdSubcategoryId - Combined key for category and subcategory.
   * @param {CreatePostDto} createPostDto - Data transfer object for creating a post.
   * @returns {Promise<PostDto>} - Promise resolving to the created PostDto.
   */
  @Post('categories/:categoryIdSubcategoryId/posts')
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostDto> {
    this.logger.log(`Criando novo post na categoria/subcategoria: ${categoryIdSubcategoryId}`);
    return this.postsService.createPost(categoryIdSubcategoryId, createPostDto);
  }

  /**
   * @Get blog
   * @description Endpoint to retrieve all blog posts for the main blog listing.
   * @returns {Promise<FullPostDto[]>} - Promise resolving to an array of FullPostDto,
   *                                     each containing full post details including author and comments.
   */
  @Get('blog')
  async findAllBlogPosts(): Promise<FullPostDto[]> { // Method name matches the service method
    this.logger.log('Buscando todos os posts do blog para a rota /blog');
    return this.postsService.getAllPosts(); // Call the correct service method
  }

  /**
   * @Get blog/:categoryIdSubcategoryId/:postId
   * @description Endpoint to retrieve a specific blog post by ID and category/subcategory for the main blog.
   * @param {string} categoryIdSubcategoryId - Combined key for category and subcategory.
   * @param {string} postId - Unique identifier for the post.
   * @returns {Promise<FullPostDto>} - Promise resolving to a FullPostDto containing full post details.
   */
  @Get('blog/:categoryIdSubcategoryId/:postId')
  async findOneBlogPost(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<FullPostDto> {
    this.logger.log(`Buscando post específico: ${postId} na categoria/subcategoria: ${categoryIdSubcategoryId} para a rota /blog/:categoryIdSubcategoryId/:postId`);
    return this.postsService.getFullPostById(categoryIdSubcategoryId, postId);
  }

  /**
   * @Get categories/:categoryIdSubcategoryId/posts
   * @description Endpoint to retrieve all posts within a specific category/subcategory.
   * @param {string} categoryIdSubcategoryId - Combined key for category and subcategory.
   * @returns {Promise<PostDto[]>} - Promise resolving to an array of PostDto,
   *                                   each containing basic post details.
   */
  @Get('categories/:categoryIdSubcategoryId/posts')
  async findAll(@Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string): Promise<PostDto[]> {
    this.logger.log(`Buscando todos os posts da categoria/subcategoria: ${categoryIdSubcategoryId}`);
    return this.postsService.getAllPosts(categoryIdSubcategoryId);
  }

  /**
   * @Get categories/:categoryIdSubcategoryId/posts/:postId
   * @description Endpoint to retrieve a specific post within a category/subcategory by its ID.
   * @param {string} categoryIdSubcategoryId - Combined key for category and subcategory.
   * @param {string} postId - Unique identifier for the post.
   * @returns {Promise<PostDto>} - Promise resolving to a PostDto containing basic post details.
   */
  @Get('categories/:categoryIdSubcategoryId/posts/:postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<PostDto> {
    this.logger.log(`Buscando post específico: ${postId} na categoria/subcategoria: ${categoryIdSubcategoryId}`);
    return this.postsService.getPostById(categoryIdSubcategoryId, postId);
  }

  /**
   * @Patch categories/:categoryIdSubcategoryId/posts/:postId
   * @description Endpoint to update an existing post within a category/subcategory.
   * @param {string} categoryIdSubcategoryId - Combined key for category and subcategory.
   * @param {string} postId - Unique identifier for the post.
   * @param {UpdatePostDto} updatePostDto - Data transfer object containing fields to update.
   * @returns {Promise<PostDto>} - Promise resolving to the updated PostDto.
   */
  @Patch('categories/:categoryIdSubcategoryId/posts/:postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDto> {
    this.logger.log(`Atualizando post: ${postId} na categoria/subcategoria: ${categoryIdSubcategoryId}`);
    return this.postsService.updatePost(categoryIdSubcategoryId, postId, updatePostDto);
  }

  /**
   * @Delete categories/:categoryIdSubcategoryId/posts/:postId
   * @description Endpoint to delete a post from a category/subcategory.
   * @param {string} categoryIdSubcategoryId - Combined key for category and subcategory.
   * @param {string} postId - Unique identifier for the post.
   * @returns {Promise<void>} - Promise resolving to void after successful deletion.
   */
  @Delete('categories/:categoryIdSubcategoryId/posts/:postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    this.logger.log(`Removendo post: ${postId} da categoria/subcategoria: ${categoryIdSubcategoryId}`);
    return this.postsService.deletePost(categoryIdSubcategoryId, postId);
  }
}
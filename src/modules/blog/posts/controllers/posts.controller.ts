// src/modules/blog/posts/controllers/posts.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PostsService } from '../services/posts.service'; // Import correto para PostsService, ajustado para estrutura de pastas comum
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';
import { FullPostDto } from '../dto/full-post.dto';

/**
 * @Controller PostsController
 * @description Controlador para gerenciar posts de blog.
 * Define endpoints para criar, recuperar, atualizar e deletar posts.
 * Este controlador lida com requisições relacionadas a posts dentro de categorias/subcategorias
 * e listagens gerais de posts do blog.
 */
@Controller() // Rota base para este controlador (pode ser ajustada se necessário)
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  /**
   * @constructor
   * @param {PostsService} postsService - Injeta a dependência de PostsService.
   * @description Construtor para PostsController, injetando o PostsService.
   */
  constructor(private readonly postsService: PostsService) { } // Injeta PostsService

  /**
   * @Post categories/:categoryIdSubcategoryId/posts
   * @description Endpoint para criar um novo post dentro de uma categoria/subcategoria específica.
   * @param {string} categoryIdSubcategoryId - Chave combinada para categoria e subcategoria.
   * @param {CreatePostDto} createPostDto - Objeto de transferência de dados para criar um post.
   * @returns {Promise<PostDto>} - Promise que resolve para o PostDto criado.
   * @throws {HttpException} - Lança em caso de erro ao criar o post.
   */
  @Post('categories/:categoryIdSubcategoryId/posts')
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostDto> {
    try {
      this.logger.log(`Criando novo post na categoria/subcategoria: ${categoryIdSubcategoryId}`);
      return await this.postsService.createPost(categoryIdSubcategoryId, createPostDto);
    } catch (error) {
      this.logger.error(`Erro ao criar post em ${categoryIdSubcategoryId}`, error.stack);
      throw new HttpException('Erro ao criar post', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @Get blog
   * @description Endpoint para recuperar todos os posts do blog para a listagem principal do blog.
   * @returns {Promise<FullPostDto[]>} - Promise que resolve para um array de FullPostDto,
   *                                        cada um contendo detalhes completos do post, incluindo autor e comentários.
   * @throws {HttpException} - Lança em caso de erro ao listar os posts do blog.
   *
   * Consideração de Performance: Para grandes volumes de posts, paginação e otimização da consulta no PostsService são cruciais.
   */
  @Get('blog')
  async findAllBlogPosts(): Promise<FullPostDto[]> { // Nome do método corresponde ao método no serviço
    try {
      this.logger.log('Buscando todos os posts do blog para a rota /blog');
      return await this.postsService.getAllPosts(); // Chama o método correto do serviço
    } catch (error) {
      this.logger.error('Erro ao listar posts do blog', error.stack);
      throw new HttpException('Erro ao listar posts do blog', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @Get blog/:categoryIdSubcategoryId/:postId
   * @description Endpoint para recuperar um post específico do blog por ID e categoria/subcategoria para o blog principal.
   * @param {string} categoryIdSubcategoryId - Chave combinada para categoria e subcategoria.
   * @param {string} postId - Identificador único para o post.
   * @returns {Promise<FullPostDto>} - Promise que resolve para um FullPostDto contendo detalhes completos do post.
   * @throws {HttpException} - Lança NotFoundException se o post não for encontrado, ou HttpException em outros erros.
   */
  @Get('blog/:categoryIdSubcategoryId/:postId')
  async findOneBlogPost(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<FullPostDto> {
    try {
      this.logger.log(`Buscando post específico: ${postId} na categoria/subcategoria: ${categoryIdSubcategoryId} para a rota /blog/:categoryIdSubcategoryId/:postId`);
      return await this.postsService.getFullPostById(categoryIdSubcategoryId, postId);
    } catch (error) {
      this.logger.error(`Erro ao buscar post ${postId} no blog`, error.stack);
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        throw error; // Re-lança NotFoundException se for o caso
      }
      throw new HttpException('Erro ao buscar post', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @Get categories/:categoryIdSubcategoryId/posts
   * @description Endpoint para recuperar todos os posts dentro de uma categoria/subcategoria específica.
   * @param {string} categoryIdSubcategoryId - Chave combinada para categoria e subcategoria.
   * @returns {Promise<PostDto[]>} - Promise que resolve para um array de PostDto,
   *                                        cada um contendo detalhes básicos do post.
   * @throws {HttpException} - Lança em caso de erro ao listar os posts da categoria/subcategoria.
   */
  @Get('categories/:categoryIdSubcategoryId/posts')
  async findAll(@Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string): Promise<PostDto[]> {
    try {
      this.logger.log(`Buscando todos os posts da categoria/subcategoria: ${categoryIdSubcategoryId}`);
      return await this.postsService.getAllPosts(categoryIdSubcategoryId); //TODO: Implementar este método no service se necessário, ou remover do controller
    } catch (error) {
      this.logger.error(`Erro ao buscar todos os posts da categoria/subcategoria: ${categoryIdSubcategoryId}`, error.stack);
      throw new HttpException('Erro ao buscar posts da categoria/subcategoria', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @Get categories/:categoryIdSubcategoryId/posts/:postId
   * @description Endpoint para recuperar um post específico dentro de uma categoria/subcategoria pelo seu ID.
   * @param {string} categoryIdSubcategoryId - Chave combinada para categoria e subcategoria.
   * @param {string} postId - Identificador único para o post.
   * @returns {Promise<PostDto>} - Promise que resolve para um PostDto contendo detalhes básicos do post.
   * @throws {HttpException} - Lança NotFoundException se o post não for encontrado, ou HttpException em outros erros.
   */
  @Get('categories/:categoryIdSubcategoryId/posts/:postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<PostDto> {
    try {
      this.logger.log(`Buscando post específico: ${postId} na categoria/subcategoria: ${categoryIdSubcategoryId}`);
      return this.postsService.getPostById(categoryIdSubcategoryId, postId);
    } catch (error) {
      this.logger.error(`Erro ao buscar post ${postId} na categoria/subcategoria: ${categoryIdSubcategoryId}`, error.stack);
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        throw error; // Re-lança NotFoundException se for o caso
      }
      throw new HttpException('Erro ao buscar post', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @Patch categories/:categoryIdSubcategoryId/posts/:postId
   * @description Endpoint para atualizar um post existente dentro de uma categoria/subcategoria.
   * @param {string} categoryIdSubcategoryId - Chave combinada para categoria e subcategoria.
   * @param {string} postId - Identificador único para o post.
   * @param {UpdatePostDto} updatePostDto - Objeto de transferência de dados contendo campos para atualizar.
   * @returns {Promise<PostDto>} - Promise que resolve para o PostDto atualizado.
   * @throws {HttpException} - Lança NotFoundException se o post não for encontrado, ou HttpException em outros erros.
   */
  @Patch('categories/:categoryIdSubcategoryId/posts/:postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDto> {
    try {
      this.logger.log(`Atualizando post: ${postId} na categoria/subcategoria: ${categoryIdSubcategoryId}`);
      return await this.postsService.updatePost(categoryIdSubcategoryId, postId, updatePostDto);
    } catch (error) {
      this.logger.error(`Erro ao atualizar post: ${postId} na categoria/subcategoria: ${categoryIdSubcategoryId}`, error.stack);
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        throw error; // Re-lança NotFoundException se for o caso
      }
      throw new HttpException('Erro ao atualizar post', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * @Delete categories/:categoryIdSubcategoryId/posts/:postId
   * @description Endpoint para deletar um post de uma categoria/subcategoria.
   * @param {string} categoryIdSubcategoryId - Chave combinada para categoria e subcategoria.
   * @param {string} postId - Identificador único para o post.
   * @returns {Promise<void>} - Promise que resolve para void após a deleção bem-sucedida.
   * @throws {HttpException} - Lança NotFoundException se o post não for encontrado, ou HttpException em outros erros.
   */
  @Delete('categories/:categoryIdSubcategoryId/posts/:postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Removendo post: ${postId} da categoria/subcategoria: ${categoryIdSubcategoryId}`);
      return this.postsService.deletePost(categoryIdSubcategoryId, postId);
    } catch (error) {
      this.logger.error(`Erro ao remover post: ${postId} da categoria/subcategoria: ${categoryIdSubcategoryId}`, error.stack);
      if (error instanceof HttpException && error.getStatus() === HttpStatus.NOT_FOUND) {
        throw error; // Re-lança NotFoundException se for o caso
      }
      throw new HttpException('Erro ao remover post', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
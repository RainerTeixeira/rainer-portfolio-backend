// src/modules/blog/posts/controllers/posts.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Logger } from '@nestjs/common';
import { PostsService } from '../services/posts.service'; // Importa o PostsService
import { CreatePostDto } from '../dto/create-post.dto'; // Importa o DTO para criação de posts
import { UpdatePostDto } from '../dto/update-post.dto'; // Importa o DTO para atualização de posts
import { PostDto } from '../dto/post.dto'; // Importa o DTO para posts (estrutura básica)
import { FullPostDto } from '../dto/full-post.dto'; // Importa o DTO para posts completos (com autor e comentários)

/**
 * @Controller PostsController
 * @description Controller responsável por gerenciar os posts do blog.
 *
 * Este controller define as rotas para operações CRUD (Create, Read, Update, Delete)
 * relacionadas a posts, além de rotas específicas para listagem geral de posts do blog
 * e detalhes de um post específico, incluindo autor e comentários.
 *
 * Rotas base:
 * - /categories/:categoryIdSubcategoryId/posts (para posts dentro de categorias/subcategorias) - Rotas para gerenciamento dentro de categorias.
 * - /blog (para rotas gerais do blog) - Rotas para funcionalidades gerais do blog (listagem geral, detalhes de posts).
 */
@Controller() // Remove a rota base do controller para permitir rotas customizadas mais flexíveis
export class PostsController {
  private readonly logger = new Logger(PostsController.name); // Logger para PostsController

  /**
   * @constructor
   * @param {PostsService} postsService - Serviço injetado paraPostsController.
   * @description Injeta o serviço de posts que contém a lógica de negócio para manipular os posts.
   */
  constructor(private readonly postsService: PostsService) { }

  /**
   * @Post categories/:categoryIdSubcategoryId/posts
   * @description Rota POST para criar um novo post dentro de uma categoria/subcategoria.
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria ('categoriaId#subcategoriaId').
   * @param {CreatePostDto} createPostDto - DTO contendo os dados para criação do post (title, content, etc.).
   * @returns {Promise<PostDto>} - Retorna uma Promise que resolve para o PostDto do post criado.
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
   * @description Rota GET para buscar todos os posts do blog (listagem geral).
   *
   * Esta rota retorna uma lista de todos os posts do blog, incluindo informações do autor e comentários
   * (retornado em FullPostDto). Rota acessível em /blog.
   *
   * @returns {Promise<FullPostDto[]>} - Retorna uma Promise que resolve para um array de FullPostDto,
   *                                     contendo todos os posts do blog com autor e comentários.
   */
  @Get('blog')
  async findAllBlogPosts(): Promise<FullPostDto[]> {
    this.logger.log('Buscando todos os posts do blog para a rota /blog');
    return this.postsService.getAllBlogPosts();
  }


  /**
   * @Get blog/:categoryIdSubcategoryId/:postId
   * @description Rota GET para buscar um post específico do blog, incluindo autor e comentários.
   *
   * Retorna um post completo (FullPostDto) com detalhes do autor e comentários relacionados.
   * Rota acessível em /blog/:categoryIdSubcategoryId/:postId.
   *
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria do post.
   * @param {string} postId - ID do post a ser buscado.
   * @returns {Promise<FullPostDto>} - Retorna uma Promise que resolve para um FullPostDto,
   *                                     contendo o post completo com autor e comentários.
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
   * @description Rota GET para buscar todos os posts dentro de uma categoria/subcategoria específica.
   *
   * Retorna uma lista de PostDto (estrutura básica de posts) para a categoria/subcategoria informada.
   * Rota acessível em /categories/:categoryIdSubcategoryId/posts.
   *
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria para filtrar os posts.
   * @returns {Promise<PostDto[]>} - Retorna uma Promise que resolve para um array de PostDto,
   *                                   contendo os posts da categoria/subcategoria especificada.
   */
  @Get('categories/:categoryIdSubcategoryId/posts')
  async findAll(@Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string): Promise<PostDto[]> {
    this.logger.log(`Buscando todos os posts da categoria/subcategoria: ${categoryIdSubcategoryId}`);
    return this.postsService.getAllPosts(categoryIdSubcategoryId); // Passa categoryIdSubcategoryId para filtrar posts
  }


  /**
   * @Get categories/:categoryIdSubcategoryId/posts/:postId
   * @description Rota GET para buscar um post específico dentro de uma categoria/subcategoria.
   *
   * Retorna um PostDto (estrutura básica de post) correspondente ao ID e categoria/subcategoria informados.
   * Rota acessível em /categories/:categoryIdSubcategoryId/posts/:postId.
   *
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria do post.
   * @param {string} postId - ID do post a ser buscado.
   * @returns {Promise<PostDto>} - Retorna uma Promise que resolve para um PostDto,
   *                                 contendo o post da categoria/subcategoria especificada.
   */
  @Get('categories/:categoryIdSubcategoryId/posts/:postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<PostDto> {
    this.logger.log(`Buscando post específico: ${postId} na categoria/subcategoria: ${categoryIdSubcategoryId}`);
    return this.postsService.getPostById(categoryIdSubcategoryId, postId); // Mantém chamada a getPostById
  }

  /**
   * @Patch categories/:categoryIdSubcategoryId/posts/:postId
   * @description Rota PATCH para atualizar um post existente dentro de uma categoria/subcategoria.
   *
   * Recebe os dados para atualização no corpo da requisição e retorna o PostDto atualizado.
   * Rota acessível em /categories/:categoryIdSubcategoryId/posts/:postId.
   *
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria do post.
   * @param {string} postId - ID do post a ser atualizado.
   * @param {UpdatePostDto} updatePostDto - DTO contendo os dados para atualização do post.
   * @returns {Promise<PostDto>} - Retorna uma Promise que resolve para o PostDto atualizado.
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
   * @description Rota DELETE para remover um post existente dentro de uma categoria/subcategoria.
   *
   * Não retorna conteúdo em caso de sucesso (código 204 No Content implícito).
   * Rota acessível em /categories/:categoryIdSubcategoryId/posts/:postId.
   *
   * @param {string} categoryIdSubcategoryId - Chave composta da categoria e subcategoria do post.
   * @param {string} postId - ID do post a ser removido.
   * @returns {Promise<void>} - Retorna uma Promise que resolve para void (operação de deleção).
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
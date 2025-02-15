import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';
import { FullPostDto } from '../dto/full-post.dto.ts'; // Importe o novo DTO

/**
 * Controller responsável por gerenciar os posts.
 * Rotas base:
 * - /categories/:categoryIdSubcategoryId/posts (para posts dentro de categorias/subcategorias)
 * - /blog (para rotas gerais de blog, como listagem de todos os posts e detalhes de posts individuais)
 */
@Controller() // Remova a rota base 'categories/:categoryIdSubcategoryId/posts' do Controller
export class PostsController {
  /**
   * Injeta o serviço de posts que contém a lógica de negócio para manipular os posts.
   */
  constructor(private readonly postsService: PostsService) { }

  /**
   * Rota POST para criação de um novo post.
   * Mantém a rota base anterior: /categories/:categoryIdSubcategoryId/posts
   */
  @Post('categories/:categoryIdSubcategoryId/posts')
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostDto> {
    return this.postsService.createPost(categoryIdSubcategoryId, createPostDto);
  }

  /**
   * Rota GET para buscar todos os posts (agora em /blog).
   * Rota para obter todos os posts do blog, sem filtro de categoria/subcategoria.
   */
  @Get('blog') // Nova rota: /blog
  async findAllBlogPosts(): Promise<FullPostDto[]> { // Retorna FullPostDto para incluir author e comments
    return this.postsService.getAllBlogPosts();
  }


  /**
   * Rota GET para buscar um post específico (agora em /blog/:categoryIdSubcategoryId/:postId).
   * Rota para obter um post específico por categoria/subcategoria e postId, incluindo autor e comentários.
   */
  @Get('blog/:categoryIdSubcategoryId/:postId') // Nova rota: /blog/:categoryIdSubcategoryId/:postId
  async findOneBlogPost(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<FullPostDto> { // Retorna FullPostDto para incluir author e comments
    return this.postsService.getFullPostById(categoryIdSubcategoryId, postId);
  }

  /**
   * Rota GET para buscar todos os posts DENTRO de uma categoria/subcategoria (mantém a rota anterior).
   * Mantém a rota anterior: /categories/:categoryIdSubcategoryId/posts
   */
  @Get('categories/:categoryIdSubcategoryId/posts')
  async findAll(@Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string): Promise<PostDto[]> {
    return this.postsService.getAllPosts(categoryIdSubcategoryId); // Modifiquei para aceitar categoryIdSubcategoryId como parâmetro
  }


  /**
   * Rota GET para buscar um post específico DENTRO de uma categoria/subcategoria (mantém a rota anterior).
   * Mantém a rota anterior: /categories/:categoryIdSubcategoryId/posts/:postId
   */
  @Get('categories/:categoryIdSubcategoryId/posts/:postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<PostDto> {
    return this.postsService.getPostById(categoryIdSubcategoryId, postId); // Mantém chamada a getPostById
  }

  /**
   * Rota PATCH para atualizar um post existente (mantém a rota anterior).
   * Mantém a rota anterior: /categories/:categoryIdSubcategoryId/posts/:postId
   */
  @Patch('categories/:categoryIdSubcategoryId/posts/:postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostDto> {
    return this.postsService.updatePost(categoryIdSubcategoryId, postId, updatePostDto);
  }

  /**
   * Rota DELETE para remover um post (mantém a rota anterior).
   * Mantém a rota anterior: /categories/:categoryIdSubcategoryId/posts/:postId
   */
  @Delete('categories/:categoryIdSubcategoryId/posts/:postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('postId') postId: string,
  ): Promise<void> {
    return this.postsService.deletePost(categoryIdSubcategoryId, postId);
  }
}
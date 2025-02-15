// src/modules/blog/posts/controllers/posts.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';

/**
 * Controller responsável por gerenciar os posts.
 * A rota base indica que os posts estão relacionados a uma categoria e subcategoria.
 */
@Controller('categories/:categoryIdSubcategoryId/posts') // Rota base: posts dentro de uma categoria/subcategoria
export class PostsController {
  /**
   * Injeta o serviço de posts que contém a lógica de negócio para manipular os posts.
   */
  constructor(private readonly postsService: PostsService) { }

  /**
   * Rota POST para criação de um novo post.
   * Recebe o parâmetro de rota 'categoryIdSubcategoryId' e os dados do post no corpo da requisição.
   * Retorna o post criado.
   */
  @Post()
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro de rota que representa a chave composta da categoria e subcategoria
    @Body() createPostDto: CreatePostDto, // DTO contendo os dados para criação do post
  ): Promise<PostDto> {
    // Chama o método createPost do serviço para criar o post
    return this.postsService.createPost(categoryIdSubcategoryId, createPostDto);
  }

  /**
   * Rota GET para buscar todos os posts.
   * Retorna um array de PostDto.
   */
  @Get()
  async findAll(): Promise<PostDto[]> {
    // Chama o método getAllPosts do serviço para obter todos os posts
    return this.postsService.getAllPosts();
  }

  /**
   * Rota GET para buscar um post específico.
   * Recebe os parâmetros 'categoryIdSubcategoryId' e 'postId' da rota.
   * Retorna o post correspondente ao ID informado.
   */
  @Get(':postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro de rota para a chave composta da categoria/subcategoria
    @Param('postId') postId: string, // Parâmetro de rota para o ID do post
  ): Promise<PostDto> {
    // Chama o método getPostById do serviço para buscar o post pelo ID
    return this.postsService.getPostById(categoryIdSubcategoryId, postId);
  }

  /**
   * Rota PATCH para atualizar um post existente.
   * Recebe os parâmetros 'categoryIdSubcategoryId' e 'postId', além dos dados atualizados no corpo da requisição.
   * Retorna o post atualizado.
   */
  @Patch(':postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro de rota para a chave composta da categoria/subcategoria
    @Param('postId') postId: string, // Parâmetro de rota para o ID do post a ser atualizado
    @Body() updatePostDto: UpdatePostDto, // DTO contendo os dados para atualização do post
  ): Promise<PostDto> {
    // Chama o método updatePost do serviço para atualizar o post
    return this.postsService.updatePost(categoryIdSubcategoryId, postId, updatePostDto);
  }

  /**
   * Rota DELETE para remover um post.
   * Recebe os parâmetros 'categoryIdSubcategoryId' e 'postId'.
   * Não retorna nenhum conteúdo em caso de sucesso.
   */
  @Delete(':postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro de rota para a chave composta da categoria/subcategoria
    @Param('postId') postId: string, // Parâmetro de rota para o ID do post a ser removido
  ): Promise<void> {
    // Chama o método deletePost do serviço para remover o post
    return this.postsService.deletePost(categoryIdSubcategoryId, postId);
  }
}

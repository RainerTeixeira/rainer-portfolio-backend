// src/modules/blog/posts/controllers/posts.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, Logger } from '@nestjs/common';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { PostDto } from '../dto/post.dto';

/**
 * /*/
/* Controlador para o recurso de Posts.
/* Responsável por receber as requisições HTTP relacionadas a posts
/* dentro de categorias e subcategorias e delegar a lógica de negócios
/* para o `PostsService`.
/*/
@Controller('categories/:categoryIdSubcategoryId/posts') // Define a rota base para este controlador, lidando com requests em /categories/:categoryIdSubcategoryId/posts
export class PostsController {
  private readonly logger = new Logger(PostsController.name); // Inicializa um logger para esta classe, útil para depuração e monitoramento

  /**
   /*/
  /* Construtor do PostsController.
  /* @param postsService - Injeção de dependência do serviço PostsService,
  /*                       que contém a lógica de negócios para operações com posts.
  /*/
  constructor(private readonly postsService: PostsService) { }

  /**
   /*/
  /* Endpoint para criar um novo post.
  /* @Route POST /categories/:categoryIdSubcategoryId/posts
  /* @Param categoryIdSubcategoryId - Parâmetro de rota composto que identifica a categoria e subcategoria do post.
  /* @Body createPostDto - Corpo da requisição contendo os dados para criar um novo post, definidos pelo CreatePostDto.
  /* @Returns Promise<PostDto> - Uma Promise que resolve para um PostDto representando o post recém-criado.
  /*/
  @Post()
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Extrai o parâmetro categoryIdSubcategoryId da URL
    @Body() createPostDto: CreatePostDto, // Extrai o corpo da requisição e o mapeia para um CreatePostDto
  ): Promise<PostDto> {
    this.logger.log(`PostsController - create chamado para categoria/subcategoria: ${categoryIdSubcategoryId}`); // Loga a chamada do método create
    return this.postsService.createPost(categoryIdSubcategoryId, createPostDto); // Delega a criação do post para o PostsService
  }

  /**
   /*/
  /* Endpoint para buscar todos os posts, independentemente da categoria.
  /* @Route GET /categories/:categoryIdSubcategoryId/posts
  /* @Returns Promise<PostDto[]> - Uma Promise que resolve para um array de PostDto, representando todos os posts.
  /*/
  @Get()
  async findAll(): Promise<PostDto[]> {
    this.logger.log(`PostsController - findAll chamado`); // Loga a chamada do método findAll
    return this.postsService.getAllPosts(); // Delega a busca de todos os posts para o PostsService
  }

  /**
   /*/
  /* Endpoint para buscar um post específico por ID dentro de uma categoria/subcategoria.
  /* @Route GET /categories/:categoryIdSubcategoryId/posts/:postId
  /* @Param categoryIdSubcategoryId - Parâmetro de rota composto que identifica a categoria e subcategoria do post.
  /* @Param postId - Parâmetro de rota que identifica o ID do post a ser buscado.
  /* @Returns Promise<PostDto> - Uma Promise que resolve para um PostDto representando o post encontrado.
  /*/
  @Get(':postId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Extrai o parâmetro categoryIdSubcategoryId da URL
    @Param('postId') postId: string, // Extrai o parâmetro postId da URL
  ): Promise<PostDto> {
    this.logger.log(`PostsController - findOne chamado para categoria/subcategoria: ${categoryIdSubcategoryId} e postId: ${postId}`); // Loga a chamada do método findOne
    return this.postsService.getPostById(categoryIdSubcategoryId, postId); // Delega a busca do post por ID para o PostsService
  }

  /**
   /*/
  /* Endpoint para atualizar um post existente por ID dentro de uma categoria/subcategoria.
  /* @Route PATCH /categories/:categoryIdSubcategoryId/posts/:postId
  /* @Param categoryIdSubcategoryId - Parâmetro de rota composto que identifica a categoria e subcategoria do post.
  /* @Param postId - Parâmetro de rota que identifica o ID do post a ser atualizado.
  /* @Body updatePostDto - Corpo da requisição contendo os dados para atualizar o post, definidos pelo UpdatePostDto.
  /* @Returns Promise<PostDto> - Uma Promise que resolve para um PostDto representando o post atualizado.
  /*/
  @Patch(':postId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Extrai o parâmetro categoryIdSubcategoryId da URL
    @Param('postId') postId: string, // Extrai o parâmetro postId da URL
    @Body() updatePostDto: UpdatePostDto, // Extrai o corpo da requisição e o mapeia para um UpdatePostDto
  ): Promise<PostDto> {
    this.logger.log(`PostsController - update chamado para categoria/subcategoria: ${categoryIdSubcategoryId} e postId: ${postId}`); // Loga a chamada do método update
    return this.postsService.updatePost(categoryIdSubcategoryId, postId, updatePostDto); // Delega a atualização do post para o PostsService
  }

  /**
   /*/
  /* Endpoint para remover um post por ID dentro de uma categoria/subcategoria.
  /* @Route DELETE /categories/:categoryIdSubcategoryId/posts/:postId
  /* @Param categoryIdSubcategoryId - Parâmetro de rota composto que identifica a categoria e subcategoria do post.
  /* @Param postId - Parâmetro de rota que identifica o ID do post a ser removido.
  /* @Returns Promise<void> - Uma Promise que resolve para void, indicando que a operação de deleção foi concluída.
  /*/
  @Delete(':postId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Extrai o parâmetro categoryIdSubcategoryId da URL
    @Param('postId') postId: string, // Extrai o parâmetro postId da URL
  ): Promise<void> {
    this.logger.log(`PostsController - remove chamado para categoria/subcategoria: ${categoryIdSubcategoryId} e postId: ${postId}`); // Loga a chamada do método remove
    return this.postsService.deletePost(categoryIdSubcategoryId, postId); // Delega a deleção do post para o PostsService
  }
}
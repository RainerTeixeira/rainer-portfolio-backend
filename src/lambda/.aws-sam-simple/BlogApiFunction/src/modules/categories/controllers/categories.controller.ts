/**
 * @fileoverview Controller de Categorias
 *
 * Controller responsável por expor endpoints HTTP para gerenciamento de categorias
 * utilizadas na organização de posts.
 *
 * Responsabilidades:
 * - Validar/receber inputs via DTOs.
 * - Delegar operações ao `CategoriesService`.
 * - Descrever a API via decorators Swagger.
 *
 * @module modules/categories/controllers/categories.controller
 */

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Cria uma nova categoria.
   *
   * @param {CreateCategoryDto} dto Dados da categoria.
   * @returns {unknown} Resultado da criação.
   */
  @Post()
  @ApiOperation({
    summary: 'Criar nova categoria',
    description: 'Cria uma nova categoria para organizar posts',
  })
  @ApiResponse({
    status: 201,
    description: 'Categoria criada com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto);
  }

  /**
   * Lista todas as categorias.
   *
   * @returns {unknown} Lista de categorias.
   */
  @Get()
  @ApiOperation({
    summary: 'Listar categorias',
    description: 'Retorna todas as categorias cadastradas',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorias retornada com sucesso',
    type: ApiResponseDto,
  })
  async findAll() {
    const categories = await this.categoriesService.getAllCategories();
    return {
      success: true,
      message: 'Categorias encontradas com sucesso',
      data: categories
    };
  }

  /**
   * Busca uma categoria pelo ID.
   *
   * @param {string} id ID da categoria.
   * @returns {unknown} Categoria encontrada.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar categoria por ID',
    description: 'Retorna uma categoria específica pelo seu ID',
  })
  @ApiParam({ name: 'id', description: 'ID da categoria', example: 'AmfYq9ckEHMOjaPq1jvEK' })
  @ApiResponse({
    status: 200,
    description: 'Categoria encontrada',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria não encontrada',
  })
  findOne(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  /**
   * Busca uma categoria pelo slug.
   *
   * @param {string} slug Slug da categoria.
   * @returns {unknown} Categoria encontrada.
   */
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Buscar categoria por slug',
    description: 'Retorna uma categoria específica através do seu slug URL-friendly',
  })
  @ApiParam({ name: 'slug', description: 'Slug da categoria', example: 'tecnologia' })
  @ApiResponse({
    status: 200,
    description: 'Categoria encontrada',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria não encontrada',
  })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.getCategoryBySlug(slug);
  }

  /**
   * Atualiza uma categoria.
   *
   * @param {string} id ID da categoria.
   * @param {UpdateCategoryDto} dto Campos a serem atualizados.
   * @returns {unknown} Categoria atualizada.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar categoria',
    description: 'Atualiza uma categoria existente',
  })
  @ApiParam({ name: 'id', description: 'ID da categoria', example: 'AmfYq9ckEHMOjaPq1jvEK' })
  @ApiResponse({
    status: 200,
    description: 'Categoria atualizada com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria não encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, dto);
  }

  /**
   * Remove uma categoria.
   *
   * @param {string} id ID da categoria.
   * @returns {unknown} Resultado da remoção.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar categoria',
    description: 'Remove permanentemente uma categoria',
  })
  @ApiParam({ name: 'id', description: 'ID da categoria', example: 'AmfYq9ckEHMOjaPq1jvEK' })
  @ApiResponse({
    status: 200,
    description: 'Categoria deletada com sucesso',
    type: ApiResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Categoria não encontrada',
  })
  remove(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}

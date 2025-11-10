/**
 * Controlador de Categorias
 *
 * Controller NestJS para endpoints de categorias.
 * Implementa rotas REST com documentação Swagger.
 *
 * @module modules/categories/categories.controller
 */
import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import type { CreateCategoryData, UpdateCategoryData } from './category.model.js';

/**
 * CategoriesController
 *
 * Endpoints REST para gerenciar categorias hierárquicas (categorias principais e subcategorias).
 */
@ApiTags('🏷️ Categorias')
@Controller('categories')
/**
 * Controlador NestJS responsável por gerenciar categorias e subcategorias.
 *
 * Função: expõe endpoints REST para criação, listagem, busca, atualização
 * e remoção de categorias, além de consultas por hierarquia.
 *
 * Convenções de resposta:
 * - Retorna objetos com `success`, e opcionalmente `data`, `message` e `pagination`.
 * - Validações e erros seguem códigos HTTP e pipes configurados no projeto.
 *
 * Observações:
 * - Documentação OpenAPI/Swagger via decorators por endpoint.
 * - Este bloco é exclusivamente JSDoc; não há alterações de lógica.
 */
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * Cria nova categoria ou subcategoria.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '➕ Criar Categoria' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Tecnologia' },
        slug: { type: 'string', example: 'tecnologia' },
        description: { type: 'string', example: 'Artigos sobre tecnologia e inovação', nullable: true },
        parentId: { type: 'string', example: '507f1f77bcf86cd799439011', nullable: true },
      },
      required: ['name', 'slug'],
    },
  })
  async create(@Body() data: CreateCategoryData) {
    const category = await this.categoriesService.createCategory(data);
    return { success: true, data: category };
  }

  /**
   * Lista categorias principais (sem parentId).
   */
  @Get()
  @ApiOperation({ summary: '📋 Listar Categorias Principais' })
  async list() {
    const categories = await this.categoriesService.listMainCategories();
    return { success: true, data: categories };
  }

  /**
   * Lista todas as subcategorias disponíveis (parentId != null).
   * IMPORTANTE: Esta rota deve vir antes de rotas dinâmicas como :id
   */
  @Get('subcategories/all')
  @ApiOperation({ summary: '📂 Listar Todas as Subcategorias' })
  async getAllSubcategories() {
    const subcategories = await this.categoriesService.listAllSubcategories();
    return { success: true, data: subcategories };
  }

  /**
   * Busca categoria por slug.
   */
  @Get('slug/:slug')
  @ApiOperation({ summary: '🔍 Buscar por Slug' })
  @ApiParam({ name: 'slug' })
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.getCategoryBySlug(slug);
    return { success: true, data: category };
  }

  /**
   * Lista subcategorias de uma categoria pai.
   */
  @Get(':id/subcategories')
  @ApiOperation({ summary: '📂 Listar Subcategorias' })
  @ApiParam({ name: 'id' })
  async getSubcategories(@Param('id') id: string) {
    const subcategories = await this.categoriesService.listSubcategories(id);
    return { success: true, data: subcategories };
  }

  /**
   * Busca categoria por ID.
   * IMPORTANTE: Esta rota deve vir por último para não capturar rotas específicas
   */
  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Categoria' })
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    const category = await this.categoriesService.getCategoryById(id);
    return { success: true, data: category };
  }

  /**
   * Atualiza categoria existente.
   */
  @Put(':id')
  @ApiOperation({ summary: '✏️ Atualizar Categoria' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Tecnologia Atualizada' },
        slug: { type: 'string', example: 'tecnologia-atualizada' },
        description: { type: 'string', example: 'Nova descrição', nullable: true },
      },
    },
  })
  async update(@Param('id') id: string, @Body() data: UpdateCategoryData) {
    const category = await this.categoriesService.updateCategory(id, data);
    return { success: true, data: category };
  }

  /**
   * Remove categoria por ID.
   */
  @Delete(':id')
  @ApiOperation({ summary: '🗑️ Deletar Categoria' })
  @ApiParam({ name: 'id' })
  async delete(@Param('id') id: string) {
    return await this.categoriesService.deleteCategory(id);
  }
}


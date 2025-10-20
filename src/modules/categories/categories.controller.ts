import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import type { CreateCategoryData, UpdateCategoryData } from './category.model.js';

@ApiTags('🏷️ Categorias')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

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

  @Get()
  @ApiOperation({ summary: '📋 Listar Categorias Principais' })
  async list() {
    const categories = await this.categoriesService.listMainCategories();
    return { success: true, data: categories };
  }

  @Get(':id')
  @ApiOperation({ summary: '🔍 Buscar Categoria' })
  @ApiParam({ name: 'id' })
  async findById(@Param('id') id: string) {
    const category = await this.categoriesService.getCategoryById(id);
    return { success: true, data: category };
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: '🔍 Buscar por Slug' })
  @ApiParam({ name: 'slug' })
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.getCategoryBySlug(slug);
    return { success: true, data: category };
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: '📂 Listar Subcategorias' })
  @ApiParam({ name: 'id' })
  async getSubcategories(@Param('id') id: string) {
    const subcategories = await this.categoriesService.listSubcategories(id);
    return { success: true, data: subcategories };
  }

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

  @Delete(':id')
  @ApiOperation({ summary: '🗑️ Deletar Categoria' })
  @ApiParam({ name: 'id' })
  async delete(@Param('id') id: string) {
    return await this.categoriesService.deleteCategory(id);
  }
}


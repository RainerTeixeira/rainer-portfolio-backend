/**
 * @file subcategory.controller.ts
 * @description
 * Controller responsável por expor endpoints REST para operações relacionadas à entidade Subcategory.
 * Atua como camada de entrada da aplicação, recebendo requisições HTTP e delegando a lógica de negócios ao serviço SubcategoryService.
 * 
 * Principais responsabilidades:
 * - Criar, atualizar, remover e buscar subcategorias por ID ou slug.
 * - Listar subcategorias por categoria pai.
 * - Documentar a API utilizando Swagger.
 * 
 * Observações:
 * - Cada endpoint está devidamente anotado para documentação automática.
 * - O controller não implementa lógica de negócio, apenas orquestra as chamadas ao serviço.
 */

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { SubcategoryService } from './subcategory.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoryEntity } from './subcategory.entity';

/**
 * Controller responsável por expor endpoints REST para operações de subcategoria.
 * Recebe requisições HTTP, valida dados e delega a lógica de negócio ao serviço de subcategorias.
 * Utiliza decorators do Swagger para documentação automática da API.
 */
@ApiTags('Subcategorias')
@Controller('subcategories')
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) { }

  /**
   * Endpoint para criar uma nova subcategoria.
   * Recebe dados via DTO e retorna a entidade criada.
   * @param createDto Dados para criação da subcategoria.
   * @returns Subcategoria criada.
   */
  @Post()
  @ApiOperation({ summary: 'Cria uma nova subcategoria' })
  @ApiBody({ type: CreateSubcategoryDto })
  @ApiResponse({ status: 201, description: 'Subcategoria criada com sucesso', type: SubcategoryEntity })
  async create(@Body() createDto: CreateSubcategoryDto): Promise<SubcategoryEntity> {
    return await this.subcategoryService.create(createDto);
  }

  /**
   * Endpoint para buscar uma subcategoria pelo ID.
   * Retorna a entidade correspondente ao ID informado.
   * @param id Identificador da subcategoria.
   * @returns Subcategoria encontrada.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Busca uma subcategoria pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da subcategoria' })
  @ApiResponse({ status: 200, description: 'Subcategoria encontrada', type: SubcategoryEntity })
  @ApiResponse({ status: 404, description: 'Subcategoria não encontrada' })
  async findById(@Param('id') id: string): Promise<SubcategoryEntity> {
    return await this.subcategoryService.findById(id);
  }

  /**
   * Endpoint para atualizar uma subcategoria existente.
   * Recebe dados via DTO e retorna a entidade atualizada.
   * @param id Identificador da subcategoria.
   * @param updateDto Dados para atualização.
   * @returns Subcategoria atualizada.
   */
  @Put(':id')
  @ApiOperation({ summary: 'Atualiza uma subcategoria existente' })
  @ApiParam({ name: 'id', description: 'ID da subcategoria' })
  @ApiBody({ type: UpdateSubcategoryDto })
  @ApiResponse({ status: 200, description: 'Subcategoria atualizada', type: SubcategoryEntity })
  @ApiResponse({ status: 404, description: 'Subcategoria não encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubcategoryDto,
  ): Promise<SubcategoryEntity> {
    return await this.subcategoryService.update(id, updateDto);
  }

  /**
   * Endpoint para remover uma subcategoria pelo ID.
   * Não retorna conteúdo em caso de sucesso.
   * @param id Identificador da subcategoria.
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Remove uma subcategoria pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da subcategoria' })
  @ApiResponse({ status: 204, description: 'Subcategoria removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Subcategoria não encontrada' })
  async delete(@Param('id') id: string): Promise<void> {
    return await this.subcategoryService.delete(id);
  }

  /**
   * Endpoint para listar subcategorias por categoria pai.
   * Retorna um array de entidades de subcategorias.
   * @param parentCategoryId ID da categoria pai.
   * @returns Lista de subcategorias.
   */
  @Get('parent/:parentCategoryId')
  @ApiOperation({ summary: 'Lista subcategorias por categoria pai' })
  @ApiParam({ name: 'parentCategoryId', description: 'ID da categoria pai' })
  @ApiResponse({ status: 200, description: 'Lista de subcategorias', type: [SubcategoryEntity] })
  async findByParentCategory(@Param('parentCategoryId') parentCategoryId: string): Promise<SubcategoryEntity[]> {
    return await this.subcategoryService.findByParentCategory(parentCategoryId);
  }

  /**
   * Endpoint para buscar subcategoria pelo slug.
   * Retorna a entidade correspondente ao slug informado.
   * @param slug Slug da subcategoria.
   * @returns Subcategoria encontrada.
   */
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Busca subcategoria pelo slug' })
  @ApiParam({ name: 'slug', description: 'Slug da subcategoria' })
  @ApiResponse({ status: 200, description: 'Subcategoria encontrada', type: SubcategoryEntity })
  @ApiResponse({ status: 404, description: 'Subcategoria não encontrada' })
  async findBySlug(@Param('slug') slug: string): Promise<SubcategoryEntity> {
    return await this.subcategoryService.findBySlug(slug);
  }
}

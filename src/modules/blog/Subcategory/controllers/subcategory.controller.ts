// src/modules/blog/subcategory/controllers/subcategory.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubcategoryService } from '../services/subcategory.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';

@ApiTags('Subcategories')
@Controller('blog/subcategories')
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}

  @ApiOperation({ summary: 'Criar uma nova subcategoria' })
  @ApiResponse({ status: 201, description: 'Subcategoria criada com sucesso.', type: SubcategoryDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @UseGuards(CognitoAuthGuard)
  @Post()
  async create(
    @Param('categoryId') categoryId: string,
    @Body() createSubcategoryDto: CreateSubcategoryDto
  ): Promise<SubcategoryDto> {
    createSubcategoryDto.categoryId = categoryId;
    return this.subcategoryService.createSubcategory(createSubcategoryDto);
  }

  @ApiOperation({ summary: 'Buscar todas as subcategorias de uma categoria' })
  @ApiResponse({ status: 200, description: 'Lista de subcategorias retornada com sucesso.', type: [SubcategoryDto] })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
  @Get(':categoryId')
  async findAll(@Param('categoryId') categoryId: string): Promise<SubcategoryDto[]> {
    return this.subcategoryService.getAllSubcategories(categoryId);
  }

  @ApiOperation({ summary: 'Obter uma subcategoria por ID' })
  @ApiResponse({ status: 200, description: 'Retorna a subcategoria.', type: SubcategoryDto })
  @Get(':categoryId/:subcategoryId')
  async findOne(
    @Param('categoryId') categoryId: string,
    @Param('subcategoryId') subcategoryId: string,
  ): Promise<SubcategoryDto> {
    return this.subcategoryService.findOne(categoryId, subcategoryId);
  }

  @ApiOperation({ summary: 'Atualizar uma subcategoria existente' })
  @ApiResponse({ status: 200, description: 'Subcategoria atualizada com sucesso.', type: SubcategoryDto })
  @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
  @UseGuards(CognitoAuthGuard)
  @Patch(':categoryId/:subcategoryId')
  async update(
    @Param('categoryId') categoryId: string,
    @Param('subcategoryId') subcategoryId: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto
  ): Promise<SubcategoryDto> {
    return this.subcategoryService.updateSubcategory(categoryId, subcategoryId, updateSubcategoryDto);
  }

  @ApiOperation({ summary: 'Deletar uma subcategoria' })
  @ApiResponse({ status: 200, description: 'Subcategoria deletada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
  @UseGuards(CognitoAuthGuard)
  @Delete(':categoryId/:subcategoryId')
  async remove(
    @Param('categoryId') categoryId: string,
    @Param('subcategoryId') subcategoryId: string
  ): Promise<void> {
    return this.subcategoryService.deleteSubcategory(categoryId, subcategoryId);
  }

  /**
   * @GET /blog/subcategories/categoryIdSubcategoryId
   * @description Retorna todas as combinações de `categoryId#subcategoryId`.
   * @returns {Promise<string[]>} Lista de combinações no formato `categoryId#subcategoryId`.
   */
  @Get('categoryIdSubcategoryId')
  @ApiOperation({ summary: 'Retorna todas as combinações de categoryId#subcategoryId' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.', type: [String] })
  async getAllCategoryIdSubcategoryId(): Promise<string[]> {
    return this.subcategoryService.getAllCategoryIdSubcategoryId();
  }
}
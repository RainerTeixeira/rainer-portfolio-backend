// src/modules/blog/subcategory/controllers/subcategory.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubcategoryService } from '../services/subcategory.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard';

@ApiTags('Subcategories')
@Controller('categories/:categoryIdSubcategoryId/subcategories')
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}

  @ApiOperation({ summary: 'Criar uma nova subcategoria' })
  @ApiResponse({ status: 201, description: 'Subcategoria criada com sucesso.', type: SubcategoryDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @UseGuards(CognitoAuthGuard)
  @Post()
  async create(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Body() createSubcategoryDto: CreateSubcategoryDto
  ): Promise<SubcategoryDto> {
    createSubcategoryDto.categoryId = categoryIdSubcategoryId;
    return this.subcategoryService.createSubcategory(createSubcategoryDto);
  }

  @ApiOperation({ summary: 'Buscar todas as subcategorias de uma categoria' })
  @ApiResponse({ status: 200, description: 'Lista de subcategorias retornada com sucesso.', type: [SubcategoryDto] })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
  @Get()
  async findAll(@Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string): Promise<SubcategoryDto[]> {
    return this.subcategoryService.getAllSubcategories(categoryIdSubcategoryId);
  }

  @ApiOperation({ summary: 'Buscar uma subcategoria por ID' })
  @ApiResponse({ status: 200, description: 'Subcategoria retornada com sucesso.', type: SubcategoryDto })
  @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
  @Get(':subcategoryId')
  async findOne(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('subcategoryId') subcategoryId: string
  ): Promise<SubcategoryDto> {
    return this.subcategoryService.getSubcategoryById(categoryIdSubcategoryId, subcategoryId);
  }

  @ApiOperation({ summary: 'Atualizar uma subcategoria existente' })
  @ApiResponse({ status: 200, description: 'Subcategoria atualizada com sucesso.', type: SubcategoryDto })
  @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
  @UseGuards(CognitoAuthGuard)
  @Patch(':subcategoryId')
  async update(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('subcategoryId') subcategoryId: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto
  ): Promise<SubcategoryDto> {
    return this.subcategoryService.updateSubcategory(categoryIdSubcategoryId, subcategoryId, updateSubcategoryDto);
  }

  @ApiOperation({ summary: 'Deletar uma subcategoria' })
  @ApiResponse({ status: 200, description: 'Subcategoria deletada com sucesso.' })
  @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
  @UseGuards(CognitoAuthGuard)
  @Delete(':subcategoryId')
  async remove(
    @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
    @Param('subcategoryId') subcategoryId: string
  ): Promise<void> {
    return this.subcategoryService.deleteSubcategory(categoryIdSubcategoryId, subcategoryId);
  }
}
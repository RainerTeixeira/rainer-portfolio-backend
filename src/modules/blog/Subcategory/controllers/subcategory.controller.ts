// src/modules/blog/subcategory/controllers/subcategory.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SubcategoryService } from '../services/subcategory.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Subcategories')
@Controller('categories/:categoryIdSubcategoryId/subcategories') // Rota base para subcategorias dentro de categorias
export class SubcategoryController {
    constructor(private readonly subcategoryService: SubcategoryService) { }

    @ApiOperation({ summary: 'Criar uma nova subcategoria' })
    @ApiResponse({ status: 201, description: 'Subcategoria criada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    @Post()
    async create(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro da rota: categoryIdSubcategoryId
        @Body() createSubcategoryDto: CreateSubcategoryDto // Dados do corpo da requisição para criar subcategoria
    ): Promise<SubcategoryDto> {
        // Chama o método createSubcategory do SubcategoryService para criar uma nova subcategoria
        return this.subcategoryService.createSubcategory(categoryIdSubcategoryId, createSubcategoryDto); // Correto: Chamando createSubcategory
    }

    @ApiOperation({ summary: 'Buscar todas as subcategorias de uma categoria' })
    @ApiResponse({ status: 200, description: 'Lista de subcategorias retornada com sucesso.', type: [SubcategoryDto] })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    @Get()
    async findAll(@Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string): Promise<SubcategoryDto[]> {
        // Chama o método getAllSubcategories do SubcategoryService para buscar todas as subcategorias de uma categoria
        return this.subcategoryService.getAllSubcategories(categoryIdSubcategoryId); // Correto: Chamando getAllSubcategories
    }

    @ApiOperation({ summary: 'Buscar uma subcategoria por ID' })
    @ApiResponse({ status: 200, description: 'Subcategoria retornada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    @Get(':subcategoryId')
    async findOne(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro da rota: categoryIdSubcategoryId
        @Param('subcategoryId') subcategoryId: string // Parâmetro da rota: subcategoryId
    ): Promise<SubcategoryDto> {
        // Chama o método getSubcategoryById do SubcategoryService para buscar uma subcategoria por ID
        return this.subcategoryService.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Correto: Chamando getSubcategoryById
    }

    @ApiOperation({ summary: 'Atualizar uma subcategoria existente' })
    @ApiResponse({ status: 200, description: 'Subcategoria atualizada com sucesso.', type: SubcategoryDto })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    @Patch(':subcategoryId')
    async update(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro da rota: categoryIdSubcategoryId
        @Param('subcategoryId') subcategoryId: string, // Parâmetro da rota: subcategoryId
        @Body() updateSubcategoryDto: UpdateSubcategoryDto // Dados do corpo da requisição para atualizar subcategoria
    ): Promise<SubcategoryDto> {
        // Chama o método updateSubcategory do SubcategoryService para atualizar uma subcategoria
        return this.subcategoryService.updateSubcategory(categoryIdSubcategoryId, subcategoryId, updateSubcategoryDto); // Correto: Chamando updateSubcategory
    }

    @ApiOperation({ summary: 'Deletar uma subcategoria' })
    @ApiResponse({ status: 200, description: 'Subcategoria deletada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Subcategoria não encontrada.' })
    @Delete(':subcategoryId')
    async remove(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro da rota: categoryIdSubcategoryId
        @Param('subcategoryId') subcategoryId: string // Parâmetro da rota: subcategoryId
    ): Promise<void> {
        // Chama o método deleteSubcategory do SubcategoryService para remover uma subcategoria
        return this.subcategoryService.deleteSubcategory(categoryIdSubcategoryId, subcategoryId); // Correto: Chamando deleteSubcategory
    }
}
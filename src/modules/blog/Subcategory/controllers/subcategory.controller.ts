// src/modules/blog/subcategory/controllers/subcategory.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SubcategoryService } from '../services/subcategory.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';

@Controller('categories/:categoryIdSubcategoryId/subcategories') // Rota base para subcategorias dentro de categorias
export class SubcategoryController {
    constructor(private readonly subcategoryService: SubcategoryService) { }

    @Post()
    async create(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro da rota: categoryIdSubcategoryId
        @Body() createSubcategoryDto: CreateSubcategoryDto // Dados do corpo da requisição para criar subcategoria
    ): Promise<SubcategoryDto> {
        // Chama o método createSubcategory do SubcategoryService para criar uma nova subcategoria
        return this.subcategoryService.createSubcategory(categoryIdSubcategoryId, createSubcategoryDto); // Correto: Chamando createSubcategory
    }

    @Get()
    async findAll(@Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string): Promise<SubcategoryDto[]> {
        // Chama o método getAllSubcategories do SubcategoryService para buscar todas as subcategorias de uma categoria
        return this.subcategoryService.getAllSubcategories(categoryIdSubcategoryId); // Correto: Chamando getAllSubcategories
    }

    @Get(':subcategoryId')
    async findOne(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro da rota: categoryIdSubcategoryId
        @Param('subcategoryId') subcategoryId: string // Parâmetro da rota: subcategoryId
    ): Promise<SubcategoryDto> {
        // Chama o método getSubcategoryById do SubcategoryService para buscar uma subcategoria por ID
        return this.subcategoryService.getSubcategoryById(categoryIdSubcategoryId, subcategoryId); // Correto: Chamando getSubcategoryById
    }

    @Patch(':subcategoryId')
    async update(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro da rota: categoryIdSubcategoryId
        @Param('subcategoryId') subcategoryId: string, // Parâmetro da rota: subcategoryId
        @Body() updateSubcategoryDto: UpdateSubcategoryDto // Dados do corpo da requisição para atualizar subcategoria
    ): Promise<SubcategoryDto> {
        // Chama o método updateSubcategory do SubcategoryService para atualizar uma subcategoria
        return this.subcategoryService.updateSubcategory(categoryIdSubcategoryId, subcategoryId, updateSubcategoryDto); // Correto: Chamando updateSubcategory
    }

    @Delete(':subcategoryId')
    async remove(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string, // Parâmetro da rota: categoryIdSubcategoryId
        @Param('subcategoryId') subcategoryId: string // Parâmetro da rota: subcategoryId
    ): Promise<void> {
        // Chama o método deleteSubcategory do SubcategoryService para remover uma subcategoria
        return this.subcategoryService.deleteSubcategory(categoryIdSubcategoryId, subcategoryId); // Correto: Chamando deleteSubcategory
    }
}
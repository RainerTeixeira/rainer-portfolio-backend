// src/modules/blog/subcategoria/controllers/subcategoria.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'; // Importa decorators do NestJS para controllers.
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service'; // Agora 'subcategory'
import { CreateSubcategoryDto } from '@src/modules/blog/subcategory/dto/create-subcategory.dto'; // Agora 'subcategory'
import { UpdateSubcategoryDto } from '@src/modules/blog/subcategory/dto/update-subcategory.dto'; // Agora 'subcategory'
import { SubcategoryDto } from '@src/modules/blog/subcategory/dto/subcategory.dto'; // Agora 'subcategory'

@Controller('blog/subcategorias')
export class SubcategoryController {
    constructor(private readonly subcategoryService: SubcategoriaService) { }

    @Post()
    async create(@Body() createSubcategoryDto: CreateSubcategyDto): Promise<SubcategoryDto> {
        return this.subcategoryService.create(createSubcategoriaDto);
    }

    @Get()
    async findAll(): Promise<SubcategoriaDto[]> {
        return this.subcategoryService.findAll();
    }

    @Get(':categoryIdSubcategoryId/:subcategoryId')
    async findOne(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
    ): Promise<SubcategoriaDto> {
        return this.subcategoryService.findOne(categoryIdSubcategoryId, subcategoryId);
    }

    @Put(':categoryIdSubcategoryId/:subcategoryId')
    async update(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
        @Body() updateSubcategoriaDto: UpdateSubcategoriaDto,
    ): Promise<SubcategoriaDto> {
        return this.subcategoryService.update(categoryIdSubcategoryId, subcategoryId, updateSubcategoriaDto);
    }

    @Delete(':categoryIdSubcategoryId/:subcategoryId')
    async remove(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
    ): Promise<void> {
        return this.subcategoryService.remove(categoryIdSubcategoryId, subcategoryId);
    }
}
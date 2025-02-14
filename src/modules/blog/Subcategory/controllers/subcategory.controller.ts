// src/modules/blog/subcategoria/controllers/subcategoria.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'; // Importa decorators do NestJS para controllers.
import { SubcategoriaService } from '@src/modules/blog/subcategoria/services/subcategory.service'; // Importa SubcategoriaService usando alias @src.
import { CreateSubcategoriaDto } from '@src/modules/blog/subcategoria/dto/create-subcategory.dto'; // Importa CreateSubcategoriaDto usando alias @src.
import { UpdateSubcategoriaDto } from '@src/modules/blog/subcategoria/dto/update-subcategory.dto'; // Importa UpdateSubcategoriaDto usando alias @src.
import { SubcategoriaDto } from '@src/modules/blog/subcategoria/dto/subcategory.dto'; // Importa SubcategoriaDto usando alias @src.

@Controller('blog/subcategorias')
export class SubcategoriaController {
    constructor(private readonly subcategoriaService: SubcategoriaService) { }

    @Post()
    async create(@Body() createSubcategoriaDto: CreateSubcategoriaDto): Promise<SubcategoriaDto> {
        return this.subcategoriaService.create(createSubcategoriaDto);
    }

    @Get()
    async findAll(): Promise<SubcategoriaDto[]> {
        return this.subcategoriaService.findAll();
    }

    @Get(':categoryIdSubcategoryId/:subcategoryId')
    async findOne(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
    ): Promise<SubcategoriaDto> {
        return this.subcategoriaService.findOne(categoryIdSubcategoryId, subcategoryId);
    }

    @Put(':categoryIdSubcategoryId/:subcategoryId')
    async update(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
        @Body() updateSubcategoriaDto: UpdateSubcategoriaDto,
    ): Promise<SubcategoriaDto> {
        return this.subcategoriaService.update(categoryIdSubcategoryId, subcategoryId, updateSubcategoriaDto);
    }

    @Delete(':categoryIdSubcategoryId/:subcategoryId')
    async remove(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
    ): Promise<void> {
        return this.subcategoriaService.remove(categoryIdSubcategoryId, subcategoryId);
    }
}
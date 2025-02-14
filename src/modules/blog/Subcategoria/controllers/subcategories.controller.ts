// src/modules/blog/subcategoria/controllers/subcategoria.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SubcategoriaService } from '../services/subcategoria.service';
import { CreateSubcategoriaDto } from '../dto/create-subcategoria.dto';
import { UpdateSubcategoriaDto } from '../dto/update-subcategoria.dto';
import { SubcategoriaDto } from '../dto/subcategoria.dto';

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
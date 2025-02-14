// src/modules/blog/Subcategory/controllers/Subcategory.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'; // Importa decorators do NestJS para controllers.
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service'; // Agora 'subcategory'
import { CreateSubcategoryDto } from '@src/modules/blog/subcategory/dto/create-subcategory.dto'; // Agora 'subcategory'
import { UpdateSubcategoryDto } from '@src/modules/blog/subcategory/dto/update-subcategory.dto'; // Agora 'subcategory'
import { SubcategoryDto } from '@src/modules/blog/subcategory/dto/subcategory.dto'; // Agora 'subcategory'

@Controller('blog/subcategorias')
export class SubcategoryController {
    constructor(private readonly subcategoryService: SubcategoryService) { }

    @Post()
    async create(@Body() createSubcategoryDto: CreateSubcategyDto): Promise<SubcategoryDto> {
        return this.subcategoryService.create(createSubcategoryDto);
    }

    @Get()
    async findAll(): Promise<SubcategoryDto[]> {
        return this.subcategoryService.findAll();
    }

    @Get(':categoryIdSubcategoryId/:subcategoryId')
    async findOne(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
    ): Promise<SubcategoryDto> {
        return this.subcategoryService.findOne(categoryIdSubcategoryId, subcategoryId);
    }

    @Put(':categoryIdSubcategoryId/:subcategoryId')
    async update(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
        @Body() UpdateSubcategoryDto: UpdateSubcategoryDto,
    ): Promise<SubcategoryDto> {
        return this.subcategoryService.update(categoryIdSubcategoryId, subcategoryId, UpdateSubcategoryDto);
    }

    @Delete(':categoryIdSubcategoryId/:subcategoryId')
    async remove(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
    ): Promise<void> {
        return this.subcategoryService.remove(categoryIdSubcategoryId, subcategoryId);
    }
}
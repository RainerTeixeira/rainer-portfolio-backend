// src/modules/blog/categories/controllers/categories.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'; // Importa decorators do NestJS para controllers.
import { CategoriesService } from '@src/modules/blog/categories/services/categories.service'; // Importa CategoriesService usando alias @src.
import { CreateCategoryDto } from '@src/modules/blog/categories/dto/create-category.dto'; // Importa CreateCategoryDto usando alias @src.
import { UpdateCategoryDto } from '@src/modules/blog/categories/dto/update-category.dto'; // Importa UpdateCategoryDto usando alias @src.
import { CategoryDto } from '@src/modules/blog/categories/dto/category.dto'; // Importa CategoryDto usando alias @src.

@Controller('blog/categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    async findAll(): Promise<CategoryDto[]> {
        return this.categoriesService.findAll();
    }

    @Get(':categoryId')
    async findOne(@Param('categoryId') categoryId: string): Promise<CategoryDto> {
        return this.categoriesService.findOne(categoryId);
    }

    @Put(':categoryId')
    async update(
        @Param('categoryId') categoryId: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<CategoryDto> {
        return this.categoriesService.update(categoryId, updateCategoryDto);
    }

    @Delete(':categoryId')
    async remove(@Param('categoryId') categoryId: string): Promise<void> {
        return this.categoriesService.remove(categoryId);
    }
}
// src/modules/blog/categories/controllers/categories.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common'; // Importa decorators do NestJS para controllers.
import { CategoryService } from '@src/modules/blog/category/services/category.service'; // Importa CategoriesService usando alias @src.
import { CreateCategoryDto } from '@src/modules/blog/category/dto/create-category.dto'; // Importa CreateCategoryDto usando alias @src.
import { UpdateCategoryDto } from '@src/modules/blog/category/dto/update-category.dto'; // Importa UpdateCategoryDto usando alias @src.
import { CategoryDto } from '@src/modules/blog/category/dto/category.dto'; // Importa CategoryDto usando alias @src.

@Controller('blog/category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        return this.categoryService.create(createCategoryDto);
    }

    @Get()
    async findAll(): Promise<CategoryDto[]> {
        return this.categoryService.findAll();
    }

    @Get(':categoryId')
    async findOne(@Param('categoryId') categoryId: string): Promise<CategoryDto> {
        return this.categoryService.findOne(categoryId);
    }

    @Put(':categoryId')
    async update(
        @Param('categoryId') categoryId: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<CategoryDto> {
        return this.categoryService.update(categoryId, updateCategoryDto);
    }

    @Delete(':categoryId')
    async remove(@Param('categoryId') categoryId: string): Promise<void> {
        return this.categoryService.remove(categoryId);
    }
}
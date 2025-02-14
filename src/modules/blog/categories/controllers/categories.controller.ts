// src/modules/blog/categories/controllers/categories.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryDto } from '../dto/category.dto';

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
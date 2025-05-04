// src/modules/category/category.controller.ts
import { Controller, Post, Get, Put, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { CategoryService } from '@src/modules/blog/category/category.service';

import { CreateCategoryDto } from '@src/modules/blog/category/dto/create-category.dto';
import { UpdateCategoryDto } from '@src/modules/blog/category/dto/update-category.dto';
import { BaseCategoryDto } from '@src/modules/blog/category/dto/base-category.dto';

@ApiTags('category')
@Controller('category')
export class CategoryController {
    constructor(private readonly service: CategoryService) { }

    @Post()
    @ApiOperation({ summary: 'Cria uma nova categoria' })
    @ApiResponse({ status: 201, type: BaseCategoryDto })
    async create(@Body() dto: CreateCategoryDto): Promise<BaseCategoryDto> {
        return this.service.create(dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Busca categoria por ID' })
    @ApiResponse({ status: 200, type: BaseCategoryDto })
    async findOne(@Param('id') id: string): Promise<BaseCategoryDto> {
        return this.service.findOne(id);
    }

    @Get('slug/:slug')
    @ApiOperation({ summary: 'Busca categoria por slug' })
    @ApiResponse({ status: 200, type: BaseCategoryDto })
    async findBySlug(@Param('slug') slug: string): Promise<BaseCategoryDto> {
        return this.service.findBySlug(slug);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Atualiza uma categoria existente' })
    @ApiResponse({ status: 200, type: BaseCategoryDto })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateCategoryDto,
    ): Promise<BaseCategoryDto> {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove uma categoria' })
    async remove(@Param('id') id: string): Promise<void> {
        return this.service.remove(id);
    }

    @Get('popular/list')
    @ApiOperation({ summary: 'Lista categorias populares' })
    @ApiResponse({ status: 200, type: [BaseCategoryDto] })
    async listPopular(
        @Query('limit') limit?: string,
    ): Promise<BaseCategoryDto[]> {
        const lmt = limit ? parseInt(limit, 10) : undefined;
        return this.service.listPopular(lmt);
    }
}
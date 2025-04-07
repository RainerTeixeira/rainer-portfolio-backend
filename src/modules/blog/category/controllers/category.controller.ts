// src/modules/blog/categories/controllers/categories.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'; // Importa decorators do NestJS para controllers.
import { CategoryService } from '@src/modules/blog/category/services/category.service'; // Importa CategoriesService usando alias @src.
import { CreateCategoryDto } from '@src/modules/blog/category/dto/create-category.dto'; // Importa CreateCategoryDto usando alias @src.
import { UpdateCategoryDto } from '@src/modules/blog/category/dto/update-category.dto'; // Importa UpdateCategoryDto usando alias @src.
import { CategoryDto } from '@src/modules/blog/category/dto/category.dto'; // Importa CategoryDto usando alias @src.
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'; // Importe decorators do Swagger
import { CognitoAuthGuard } from '@src/auth/cognito-auth.guard'; // Importa o guard de autenticação Cognito

@ApiTags('category') // Adicione tag para Swagger
@Controller('blog/category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @ApiOperation({ summary: 'Criar uma nova categoria' })
    @ApiResponse({ status: 201, description: 'A categoria foi criada com sucesso.', type: CategoryDto })
    @UseGuards(CognitoAuthGuard)
    @Post()
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        return this.categoryService.create(createCategoryDto);
    }

    @ApiOperation({ summary: 'Obter todas as categorias' })
    @ApiResponse({ status: 200, description: 'Retorna todas as categorias.', type: [CategoryDto] })
    @Get()
    async findAll(): Promise<CategoryDto[]> {
        return this.categoryService.findAll();
    }

    @ApiOperation({ summary: 'Obter uma categoria por ID' })
    @ApiResponse({ status: 200, description: 'Retorna a categoria.', type: CategoryDto })
    @Get(':categoryId')
    async findOne(@Param('categoryId') categoryId: string): Promise<CategoryDto> {
        return this.categoryService.findOne(categoryId);
    }

    @ApiOperation({ summary: 'Atualizar uma categoria por ID' })
    @ApiResponse({ status: 200, description: 'A categoria foi atualizada com sucesso.', type: CategoryDto })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    @UseGuards(CognitoAuthGuard)
    @Put(':categoryId')
    async update(
        @Param('categoryId') categoryId: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<CategoryDto> {
        return this.categoryService.update(categoryId, updateCategoryDto);
    }

    @ApiOperation({ summary: 'Deletar uma categoria por ID' })
    @ApiResponse({ status: 204, description: 'A categoria foi deletada com sucesso.' })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    @UseGuards(CognitoAuthGuard)
    @Delete(':categoryId')
    async remove(@Param('categoryId') categoryId: string): Promise<void> {
        return this.categoryService.remove(categoryId);
    }
}
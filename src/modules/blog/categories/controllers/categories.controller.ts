import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CategoriesService } from '@src/modules/blog/categories/services/categories.service';
import { CreateCategoryDto } from '@src/modules/blog/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@src/modules/blog/categories/dto/update-category.dto';
import { CategoryDto } from '@src/modules/blog/categories/dto/category.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('categories')
@Controller('blog/categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @ApiOperation({ summary: 'Criar uma nova categoria' })
    @ApiResponse({ status: 201, description: 'Categoria criada com sucesso.', type: CategoryDto })
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todas as categorias' })
    @ApiResponse({ status: 200, description: 'Lista de categorias.', type: [CategoryDto] })
    async findAll(): Promise<CategoryDto[]> {
        return this.categoriesService.findAll();
    }

    @Get(':categoryId')
    @ApiOperation({ summary: 'Obter uma categoria pelo ID' })
    @ApiResponse({ status: 200, description: 'Categoria encontrada.', type: CategoryDto })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async findOne(@Param('categoryId') categoryId: string): Promise<CategoryDto> {
        return this.categoriesService.findOne(categoryId);
    }

    @Put(':categoryId')
    @ApiOperation({ summary: 'Atualizar uma categoria pelo ID' })
    @ApiResponse({ status: 200, description: 'Categoria atualizada com sucesso.', type: CategoryDto })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async update(
        @Param('categoryId') categoryId: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<CategoryDto> {
        return this.categoriesService.update(categoryId, updateCategoryDto);
    }

    @Delete(':categoryId')
    @ApiOperation({ summary: 'Remover uma categoria pelo ID' })
    @ApiResponse({ status: 200, description: 'Categoria removida com sucesso.' })
    @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
    async remove(@Param('categoryId') categoryId: string): Promise<void> {
        return this.categoriesService.remove(categoryId);
    }
}

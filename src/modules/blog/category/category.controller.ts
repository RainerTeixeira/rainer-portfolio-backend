import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './category.entity';

/**
 * @CategoryController
 *
 * Controller responsável por receber as requisições HTTP e interagir com o serviço de categorias.
 * Expõe endpoints REST para criar, atualizar, remover, buscar e listar categorias.
 */
@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    /**
     * Endpoint para criar uma nova categoria.
     * @param createDto - Dados da categoria a ser criada (DTO).
     * @returns Uma Promise que resolve para a entidade CategoryEntity recém-criada.
     */
    @Post()
    @ApiOperation({ summary: 'Cria uma nova categoria' })
    @ApiBody({ type: CreateCategoryDto })
    @ApiResponse({ status: 201, description: 'Categoria criada', type: CategoryEntity })
    async create(@Body() createDto: CreateCategoryDto): Promise<CategoryEntity> {
        return await this.categoryService.create(createDto);
    }

    /**
     * Endpoint para buscar uma categoria pelo ID.
     * @param id - ID da categoria a ser buscada (parâmetro da rota).
     * @returns Uma Promise que resolve para a entidade CategoryEntity encontrada.
     */
    @Get(':id')
    @ApiOperation({ summary: 'Busca categoria por ID' })
    @ApiParam({ name: 'id', description: 'ID da categoria' })
    @ApiResponse({ status: 200, description: 'Categoria encontrada', type: CategoryEntity })
    async findById(@Param('id') id: string): Promise<CategoryEntity> {
        return await this.categoryService.findById(id);
    }

    /**
     * Endpoint para atualizar uma categoria existente.
     * @param id - ID da categoria a ser atualizada (parâmetro da rota).
     * @param updateDto - Dados da categoria a serem atualizados (DTO).
     * @returns Uma Promise que resolve para a entidade CategoryEntity atualizada.
     */
    @Put(':id')
    @ApiOperation({ summary: 'Atualiza uma categoria existente' })
    @ApiParam({ name: 'id', description: 'ID da categoria' })
    @ApiBody({ type: UpdateCategoryDto })
    @ApiResponse({ status: 200, description: 'Categoria atualizada', type: CategoryEntity })
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateCategoryDto,
    ): Promise<CategoryEntity> {
        return await this.categoryService.update(id, updateDto);
    }

    /**
     * Endpoint para remover uma categoria.
     * @param id - ID da categoria a ser removida (parâmetro da rota).
     * @returns Uma Promise que resolve quando a categoria é removida.
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Remove uma categoria' })
    @ApiParam({ name: 'id', description: 'ID da categoria' })
    @ApiResponse({ status: 204, description: 'Categoria removida' })
    async delete(@Param('id') id: string): Promise<void> {
        return await this.categoryService.delete(id);
    }

    /**
     * Endpoint para buscar uma categoria pelo slug.
     * @param slug - Slug da categoria a ser buscada (parâmetro da rota).
     * @returns Uma Promise que resolve para a entidade CategoryEntity encontrada.
     */
    @Get('/slug/:slug')
    @ApiOperation({ summary: 'Busca categoria por slug' })
    @ApiParam({ name: 'slug', description: 'Slug da categoria' })
    @ApiResponse({ status: 200, description: 'Categoria encontrada', type: CategoryEntity })
    async findBySlug(@Param('slug') slug: string): Promise<CategoryEntity> {
        return await this.categoryService.findBySlug(slug);
    }

    /**
     * Endpoint para listar as categorias populares.
     * @returns Uma Promise que resolve para um array de entidades CategoryEntity representando as categorias populares.
     */
    @Get('popular/list')
    @ApiOperation({ summary: 'Lista categorias populares' })
    @ApiResponse({ status: 200, description: 'Lista de categorias populares', type: [CategoryEntity] })
    async findPopularCategories(): Promise<CategoryEntity[]> {
        return await this.categoryService.findPopularCategories();
    }
}
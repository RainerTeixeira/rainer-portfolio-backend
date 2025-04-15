import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';
import { CategoryEntity } from '../entities/category.entity';

@ApiTags('Blog - Categories')
@Controller('blog/categories')
export class CategoriesController {
    constructor(private readonly service: CategoriesService) { }

    @Get('popular')
    @ApiOperation({ summary: 'Lista categorias populares' })
    @ApiResponse({
        status: 200,
        description: 'Listagem de categorias ordenadas por popularidade',
        type: [CategoryEntity]
    })
    async findPopular(): Promise<CategoryEntity[]> {
        return this.service.findPopular();
    }

    @Get(':slug')
    @ApiOperation({ summary: 'Busca categoria por slug' })
    @ApiResponse({
        status: 200,
        description: 'Detalhes completos da categoria',
        type: CategoryEntity
    })
    async findBySlug(@Param('slug') slug: string): Promise<CategoryEntity> {
        return this.service.findBySlug(slug);
    }
}
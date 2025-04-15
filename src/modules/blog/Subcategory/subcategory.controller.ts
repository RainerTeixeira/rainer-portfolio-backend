import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubcategoriesService } from '../services/subcategories.service';
import { SubcategoryEntity } from '../entities/subcategory.entity';

@ApiTags('Blog - Subcategories')
@Controller('blog/subcategories')
export class SubcategoriesController {
  constructor(private readonly service: SubcategoriesService) { }

  @Get('by-parent/:parentId')
  @ApiOperation({ summary: 'Lista subcategorias por categoria pai' })
  @ApiResponse({
    status: 200,
    description: 'Listagem de subcategorias relacionadas',
    type: [SubcategoryEntity]
  })
  async findByParent(@Param('parentId') parentId: string): Promise<SubcategoryEntity[]> {
    return this.service.findByParent(parentId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Busca subcategoria por slug' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes completos da subcategoria',
    type: SubcategoryEntity
  })
  async findBySlug(@Param('slug') slug: string): Promise<SubcategoryEntity> {
    return this.service.findBySlug(slug);
  }
}
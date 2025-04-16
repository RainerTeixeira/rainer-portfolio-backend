import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SubcategoryService } from './subcategory.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoryEntity } from './subcategory.entity';

@Controller('subcategories')
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) { }

  @Post()
  async create(@Body() createDto: CreateSubcategoryDto): Promise<SubcategoryEntity> {
    return await this.subcategoryService.create(createDto);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<SubcategoryEntity> {
    return await this.subcategoryService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSubcategoryDto,
  ): Promise<SubcategoryEntity> {
    return await this.subcategoryService.update(id, updateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return await this.subcategoryService.delete(id);
  }

  @Get('parent/:parentCategoryId')
  async findByParentCategory(@Param('parentCategoryId') parentCategoryId: string): Promise<SubcategoryEntity[]> {
    return await this.subcategoryService.findByParentCategory(parentCategoryId);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<SubcategoryEntity> {
    return await this.subcategoryService.findBySlug(slug);
  }
}

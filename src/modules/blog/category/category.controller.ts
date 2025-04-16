import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryEntity } from './category.entity';

@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    async create(@Body() createDto: CreateCategoryDto): Promise<CategoryEntity> {
        return await this.categoryService.create(createDto);
    }

    @Get(':id')
    async findById(@Param('id') id: string): Promise<CategoryEntity> {
        return await this.categoryService.findById(id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateDto: UpdateCategoryDto,
    ): Promise<CategoryEntity> {
        return await this.categoryService.update(id, updateDto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string): Promise<void> {
        return await this.categoryService.delete(id);
    }

    @Get('/slug/:slug')
    async findBySlug(@Param('slug') slug: string): Promise<CategoryEntity> {
        return await this.categoryService.findBySlug(slug);
    }

    @Get('popular/list')
    async findPopularCategories(): Promise<CategoryEntity[]> {
        return await this.categoryService.findPopularCategories();
    }
}

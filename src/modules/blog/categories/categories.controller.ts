import { Controller, Get, Post, Body, Put, Param, Delete, ValidationPipe } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDto } from './dto/category.dto';

@Controller('blog/categories') // Rota base para categorias
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    async create(@Body(new ValidationPipe()) createCategoryDto: CreateCategoryDto): Promise<CategoryDto> {
        return this.categoriesService.create(createCategoryDto);
    }

    @Get()
    async findAll(): Promise<CategoryDto[]> {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<CategoryDto> {
        return this.categoriesService.findOne(+id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body(new ValidationPipe()) updateCategoryDto: UpdateCategoryDto,
    ): Promise<CategoryDto> {
        return this.categoriesService.update(+id, updateCategoryDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.categoriesService.remove(+id);
    }
}
import { Controller, Get, Post, Body, Put, Param, Delete, ValidationPipe } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { SubcategoryDto } from './dto/subcategory.dto';

@Controller('blog/subcategories') // Rota base para subcategories
export class SubcategoriesController {
    constructor(private readonly subcategoriesService: SubcategoriesService) { }

    @Post()
    async create(@Body(new ValidationPipe()) createSubcategoryDto: CreateSubcategoryDto): Promise<SubcategoryDto> {
        return this.subcategoriesService.create(createSubcategoryDto);
    }

    @Get()
    async findAll(): Promise<SubcategoryDto[]> {
        return this.subcategoriesService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string): Promise<SubcategoryDto> {
        return this.subcategoriesService.findOne(+id);
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body(new ValidationPipe()) updateSubcategoryDto: UpdateSubcategoryDto,
    ): Promise<SubcategoryDto> {
        return this.subcategoriesService.update(+id, updateSubcategoryDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string): Promise<void> {
        return this.subcategoriesService.remove(+id);
    }
}
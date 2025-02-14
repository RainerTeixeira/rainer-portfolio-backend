// src/modules/blog/subcategory/controllers/subcategory.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SubcategoryService } from '../services/subcategory.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto'; // Correção: CreateSubcategoryDto
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { SubcategoryDto } from '../dto/subcategory.dto';

@Controller('categories/:categoryIdSubcategoryId/subcategories')
export class SubcategoryController {
    constructor(private readonly subcategoryService: SubcategoryService) { }

    @Post()
    async create(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Body() createSubcategoryDto: CreateSubcategoryDto // Correção: CreateSubcategoryDto
    ): Promise<SubcategoryDto> {
        return this.subcategoryService.createSubcategory(categoryIdSubcategoryId, createSubcategoryDto);
    }

    @Get()
    async findAll(@Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string): Promise<SubcategoryDto[]> {
        return this.subcategoryService.getAllSubcategories(categoryIdSubcategoryId);
    }

    @Get(':subcategoryId')
    async findOne(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string
    ): Promise<SubcategoryDto> {
        return this.subcategoryService.getSubcategoryById(categoryIdSubcategoryId, subcategoryId);
    }

    @Patch(':subcategoryId')
    async update(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string,
        @Body() updateSubcategoryDto: UpdateSubcategoryDto
    ): Promise<SubcategoryDto> {
        return this.subcategoryService.updateSubcategory(categoryIdSubcategoryId, subcategoryId, updateSubcategoryDto);
    }

    @Delete(':subcategoryId')
    async remove(
        @Param('categoryIdSubcategoryId') categoryIdSubcategoryId: string,
        @Param('subcategoryId') subcategoryId: string
    ): Promise<void> {
        return this.subcategoryService.deleteSubcategory(categoryIdSubcategoryId, subcategoryId);
    }
}
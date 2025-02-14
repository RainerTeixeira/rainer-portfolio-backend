// src/modules/blog/categories/categories.module.ts

import { Module } from '@nestjs/common';
import { CategoryController } from '@src/modules/blog/category/controllers/category.controller';
import { CategoryService } from '@src/modules/blog/category/services/category.service';

@Module({
    controllers: [CategoryController],
    providers: [CategoryService],
    exports: [CategoryService],
})
export class CategoryModule { }
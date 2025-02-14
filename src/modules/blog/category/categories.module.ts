// src/modules/blog/categories/categories.module.ts

import { Module } from '@nestjs/common';
import { CategoriesController } from './controllers/category.controller';
import { CategoriesService } from './services/category.service';

@Module({
    controllers: [CategoriesController],
    providers: [CategoriesService],
    exports: [CategoriesService],
})
export class CategoriesModule { }
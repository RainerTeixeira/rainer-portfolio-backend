// src/modules/blog/Subcategory/Subcategory.module.ts

import { Module } from '@nestjs/common';
import { SubcategoryController } from './controllers/subcategory.controller';
import { SubcategoriaService } from './services/subcategory.service';

@Module({
    controllers: [SubcategoryController],
    providers: [SubcategoryService],
    exports: SubcategoryService],
})
export class SubcategoryModule { }
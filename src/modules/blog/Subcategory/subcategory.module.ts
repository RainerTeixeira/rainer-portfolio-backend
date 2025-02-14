// src/modules/blog/Subcategory/Subcategory.module.ts

import { Module } from '@nestjs/common';
import { SubcategoryController } from '@src/modules/blog/Subcategory/controllers/subcategory.controller';
import { SubcategoryService } from '@src/modules/blog/Subcategory/services/subcategory.service';

@Module({
    controllers: [SubcategoryController],
    providers: [SubcategoryService],
    exports: SubcategoryService],
})
export class SubcategoryModule { }
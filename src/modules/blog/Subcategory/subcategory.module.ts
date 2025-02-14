// src/modules/blog/Subcategory/Subcategory.module.ts

import { Module } from '@nestjs/common';
import { SubcategoryController } from '@src/modules/blog/subcategory/controllers/subcategory.controller';
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service';
import { BlogModule } from '@src/modules/blog/blog.module'; // <--- IMPORTA BlogModule AQUI!

@Module({
    controllers: [SubcategoryController],
    providers: [SubcategoryService],
    exports: [SubcategoryService],
})
export class SubcategoryModule { }
// src/modules/blog/Subcategory/Subcategory.module.ts

import { Module } from '@nestjs/common';
import { SubcategoryController } from '@src/modules/blog/subcategory/controllers/subcategory.controller';
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service';
import { BlogModule } from '@src/modules/blog.module'; // <--- IMPORTA BlogModule AQUI!

@Module({
    imports: [forwardRef(() => BlogModule)], // Use forwardRef envolvendo BlogModule para resolver dependência circular
    controllers: [SubcategoryController],
    providers: [SubcategoryService],
    exports: [SubcategoryService],
})
export class SubcategoryModule { }
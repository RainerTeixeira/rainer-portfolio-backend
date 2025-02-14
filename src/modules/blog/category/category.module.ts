// src/modules/blog/categories/categories.module.ts

import { Module } from '@nestjs/common';
import { CategoryController } from '@src/modules/blog/category/controllers/category.controller';
import { CategoryService } from '@src/modules/blog/category/services/category.service';
import { BlogModule } from '@src/modules/blog.module'; // <--- IMPORTA BlogModule AQUI!

@Module({
    imports: [forwardRef(() => BlogModule)], // Use forwardRef envolvendo BlogModule para resolver dependência circular
    controllers: [CategoryController],
    providers: [CategoryService],
    exports: [CategoryService],
})
export class CategoryModule { }
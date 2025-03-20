// src/modules/blog/categories/categories.module.ts

import { Module, forwardRef } from '@nestjs/common'; // Importa o decorator Module para definir o módulo.
import { CategoryController } from '@src/modules/blog/category/controllers/category.controller';
import { CategoryService } from '@src/modules/blog/category/services/category.service';
import { BlogModule } from '@src/modules/blog.module'; // <--- IMPORTA BlogModule AQUI!
import { DynamoDbService } from '@src/services/dynamoDb.service';

@Module({
    imports: [forwardRef(() => BlogModule)], // Use forwardRef envolvendo BlogModule para resolver dependência circular
    controllers: [CategoryController],
    providers: [CategoryService, DynamoDbService],
    exports: [CategoryService],
})
export class CategoryModule { }
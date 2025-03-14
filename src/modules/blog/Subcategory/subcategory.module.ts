// src/modules/blog/Subcategory/Subcategory.module.ts

import { Module, forwardRef } from '@nestjs/common'; // Importa o decorator Module para definir o módulo.
import { SubcategoryController } from '@src/modules/blog/subcategory/controllers/subcategory.controller';
import { SubcategoryService } from '@src/modules/blog/subcategory/services/subcategory.service';
import { BlogModule } from '@src/modules/blog.module'; // <--- IMPORTA BlogModule AQUI!

@Module({
    imports: [forwardRef(() => BlogModule)], // Use forwardRef envolvendo BlogModule para resolver dependência circular
    controllers: [SubcategoryController],
    providers: [SubcategoryService],
    exports: [SubcategoryService], // Certifique-se de exportar o serviço
})
export class SubcategoryModule {}
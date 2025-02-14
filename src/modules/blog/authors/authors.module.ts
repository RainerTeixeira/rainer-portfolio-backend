// src/modules/blog/authors/authors.module.ts

import { Module, forwardRef } from '@nestjs/common'; // Importa o decorator Module para definir o módulo.
import { AuthorsController } from '@src/modules/blog/authors/controllers/authors.controller'; // Importa AuthorsController usando @src.
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service'; // Importa AuthorsService usando @src.
import { BlogModule } from '@src/modules/blog.module'; // <--- IMPORTA BlogModule AQUI!

@Module({
    imports: [forwardRef(() => BlogModule)], // Use forwardRef envolvendo BlogModule para resolver dependência circular
    controllers: [AuthorsController],
    providers: [AuthorsService],
    exports: [AuthorsService],
})
export class AuthorsModule { }



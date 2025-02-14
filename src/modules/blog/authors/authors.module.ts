// src/modules/blog/authors/authors.module.ts

import { Module } from '@nestjs/common'; // Importa o decorator Module para definir o módulo.
import { AuthorsController } from '@src/modules/blog/authors/controllers/authors.controller'; // Importa AuthorsController usando @src.
import { AuthorsService } from '@src/modules/blog/authors/services/authors.service'; // Importa AuthorsService usando @src.

@Module({
    controllers: [AuthorsController], // Declara os controllers deste módulo.
    providers: [AuthorsService],     // Declara os providers (services) deste módulo.
    exports: [AuthorsService],       // Exporta AuthorsService para outros módulos.
})
export class AuthorsModule { }
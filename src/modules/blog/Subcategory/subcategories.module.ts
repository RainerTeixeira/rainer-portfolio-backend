// src/modules/blog/subcategoria/subcategoria.module.ts

import { Module } from '@nestjs/common';
import { SubcategoriaController } from './controllers/subcategoria.controller';
import { SubcategoriaService } from './services/subcategoria.service';

@Module({
    controllers: [SubcategoriaController],
    providers: [SubcategoriaService],
    exports: [SubcategoriaService],
})
export class SubcategoriaModule { }
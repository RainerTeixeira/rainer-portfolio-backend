// src/modules/blog/authors/authors.module.ts

import { Module } from '@nestjs/common';
import { AuthorsController } from './controllers/authors.controller';
import { AuthorsService } from './services/authors.service';

@Module({
    controllers: [AuthorsController], // Declara AuthorsController
    providers: [AuthorsService],     // Declara AuthorsService
    exports: [AuthorsService],       // Exporta AuthorsService se precisar usar em outros módulos
})
export class AuthorsModule { }
// src/controller/authors/authors.module.ts
import { Module } from '@nestjs/common';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';

@Module({
    controllers: [AuthorsController],
    providers: [AuthorsService],
})
export class AuthorsModule { }

// src/modules/blog/authors/authors.module.ts

import { Module } from '@nestjs/common'; // Importa o decorator Module para definir o módulo.
import { DynamoDbService } from '@src/services/dynamoDb.service';
import { AuthorsController } from '@src/modules/blog/authors/authors.controller';
import { AuthorsService } from '@src/modules/blog/authors/authors.service'; 
import { AuthorRepository } from '@src/modules/blog/authors/author.repository'; 
import { CacheModule } from '@nestjs/cache-manager';
@Module({
    imports: [
        DynamoDbService,
        CacheModule.register()
    ],
    controllers: [AuthorsController],
    providers: [
        AuthorsService,
        AuthorRepository
    ],
    exports: [AuthorsService]
})
export class AuthorsModule { }

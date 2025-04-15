/**
 * Módulo responsável pela gestão de autores no contexto do blog.
 * Realiza a integração entre controller, service, repositório e recursos de cache.
 *
 * Responsabilidades:
 * - Disponibiliza endpoints REST para operações de autores.
 * - Gerencia dependências de serviço, repositório e cache.
 * - Exporta o serviço de autores para uso em outros módulos.
 *
 * Estrutura:
 * - Controller: AuthorsController
 * - Service: AuthorsService
 * - Repository: AuthorRepository
 * - Integração com DynamoDbService e CacheModule
 *
 * @module AuthorsModule
 */

import { Module } from '@nestjs/common';
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

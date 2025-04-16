import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { AuthorsController } from './authors.controller';
import { AuthorService } from './authors.service';
import { AuthorRepository } from './author.repository';

/**
 * Responsabilidades:
 * - Disponibiliza endpoints REST para operações de autores.
 * - Gerencia dependências de serviço, repositório e cache.
 * - Exporta o serviço de autores para uso em outros módulos.
 *
 * Estrutura:
 * - Controller: AuthorController
 * - Service: AuthorService
 * - Repository: AuthorRepository
 * - Integração com DynamoDbService (global) e CacheModule
 *
 * @module AuthorsModule
 */
@Module({
    imports: [
        // Cache local (se você quiser uma config diferente da global)
        CacheModule.register({
            ttl: 300,
            max: 100,
        }),
    ],
    controllers: [AuthorsController],
    providers: [AuthorService, AuthorRepository],
    exports: [AuthorService],
})
export class AuthorsModule { }

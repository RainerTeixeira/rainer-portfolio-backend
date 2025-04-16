import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { CategotyController } from './category.controller';
import { CategoryService } from './category.controller';
import { CategoryRepository } from './category.repository'

/**
 * Responsabilidades:
 * - Disponibiliza endpoints REST para operações de categorias.
 * - Gerencia dependências de serviço, repositório e cache.
 * - Exporta o serviço de categorias para uso em outros módulos.
 *
 * Estrutura:
 * - Controller: CategotyController
 * - Service: CategoryService
 * - Repository: CategoryRepository
 * - Integração com DynamoDbService (global) e CacheModule
 *
 * @module CategoryModule
 */
@Module({
    imports: [
        // Cache local (se você quiser uma config diferente da global)
        CacheModule.register({
            ttl: 300,
            max: 100,
        }),
    ],
    controllers: [CategotyController],
    providers: [CategoryService, CategoryRepository],
    exports: [CategoryService],
})
export class CategoryModule { }

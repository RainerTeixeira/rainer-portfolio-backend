// src/modules/blog/subcategory/subcategory.module.ts
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { SubcategoryController } from './subcategory.controller';
import { SubcategoryService } from './subcategory.service';
import { SubcategoryRepository } from './subcategory.repository';

/**
 * Responsabilidades:
 * - Disponibiliza endpoints REST para operações de subcategorias.
 * - Gerencia a lógica de negócios relacionada às subcategorias.
 *   * - Interage com o repositório de subcategorias para operações de banco de dados.
 * * - Gerencia dependências de serviço, repositório e cache.
 * - Exporta o serviço de subcategorias para uso em outros módulos.
 *
 * Estrutura:
 * - Controller: SubcategoryController    
 * - Service: SubcategoryService
 * - Repository: SubcategoryRepository  
 * - Integração com DynamoDbService (global) e CacheModule
 *  
 * @module SubcategoryModule 
 */

@Module({
    imports: [
        // Cache local (se você quiser uma config diferente da global)
        CacheModule.register({
            ttl: 300,
            max: 100,
        }),
    ],
    controllers: [SubcategoryController],
    providers: [SubcategoryService, SubcategoryRepository],
    exports: [SubcategoryService],
})
export class SubcategoryModule { }

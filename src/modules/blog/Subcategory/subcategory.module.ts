import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { SubcategoriesController } from './subcategory.controller';
import { SubcategoriesService } from './subcategory.service';
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
 * - Controller: SubcategoriesController    
 * - Service: SubcategoriesService
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
    controllers: [SubcategoriesController],
    providers: [SubcategoriesService, SubcategoryRepository],
    exports: [SubcategoriesService],
})
export class SubcategoryModule { }
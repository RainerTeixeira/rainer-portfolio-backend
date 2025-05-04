import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { CategoryController } from '@src/modules/blog/category/category.controller'; // Nome corrigido
import { CategoryService } from '@src/modules/blog/category/category.service'; // Importação corrigida

/**
 * Responsabilidades:
 * - Disponibiliza endpoints REST para operações de categorias.
 * - Gerencia dependências de serviço, repositório e cache.
 * - Exporta o serviço de catego as para uso em outros módulos.
 *
 * Estrutura:
 * - Controller: CategoryController 
 * - Service: CategoryService
 * - Integração com DynamoDbService (global) e CacheModule
 *
 * @module CategoryModule
 */

/**
 * Módulo responsável por agrupar todos os componentes relacionados à categoria.
 * Inclui controller, service, repository e configuração de cache.
 * Exporta o serviço para uso em outros módulos da aplicação.
 */
@Module({
    imports: [
        // Configuração do CacheModule com TTL de 5 minutos e tamanho máximo de 100 itens
        CacheModule.register({
            ttl: 300,  // Tempo de vida do cache em segundos (5 minutos)
            max: 100,  // Número máximo de itens no cache
        }),
    ],
    controllers: [CategoryController],  // Injeção do Controller
    providers: [CategoryService],  // Injeção do Service
    exports: [CategoryService],  // Permite que o CategoryService seja utilizado em outros módulos
})
export class CategoryModule { }
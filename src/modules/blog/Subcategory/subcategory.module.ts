/**
 * @file subcategory.module.ts
 * @description
 * Módulo responsável por agrupar e disponibilizar todos os componentes relacionados à entidade Subcategory.
 * 
 * Principais responsabilidades:
 * - Registrar controllers, serviços e repositórios de subcategorias.
 * - Configurar o módulo de cache para otimização de performance.
 * - Exportar o serviço de subcategorias para uso em outros módulos da aplicação.
 * 
 * Observações:
 * - Segue o padrão de módulos do NestJS para organização e injeção de dependências.
 * - Permite fácil manutenção e escalabilidade do domínio de subcategorias.
 */

import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { SubcategoryController } from './subcategory.controller';
import { SubcategoryService } from './subcategory.service';
import { SubcategoryRepository } from './subcategory.repository';

/**
 * Módulo responsável por agrupar todos os componentes relacionados à subcategoria.
 * Inclui controller, service, repository e configuração de cache.
 * Exporta o serviço para uso em outros módulos da aplicação.
 */
@Module({
    imports: [
        // Configuração de cache local com TTL e limite de itens
        CacheModule.register({
            ttl: 300, // Tempo de vida do cache em segundos
            max: 100, // Número máximo de itens no cache
        }),
    ],
    controllers: [SubcategoryController], // Controlador responsável pelos endpoints REST
    providers: [SubcategoryService, SubcategoryRepository], // Serviços e repositórios
    exports: [SubcategoryService], // Serviço exportado para uso em outros módulos
})
export class SubcategoryModule { }

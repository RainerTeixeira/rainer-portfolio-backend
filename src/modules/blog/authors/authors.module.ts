/**
 * @file authors.module.ts
 * @description
 * Módulo responsável por agrupar e disponibilizar todos os componentes relacionados à entidade Author.
 * 
 * Principais responsabilidades:
 * - Registrar controllers, serviços e repositórios de autores.
 * - Configurar o módulo de cache para otimização de performance.
 * - Exportar o serviço de autores para uso em outros módulos da aplicação.
 * 
 * Observações:
 * - Segue o padrão de módulos do NestJS para organização e injeção de dependências.
 * - Permite fácil manutenção e escalabilidade do domínio de autores.
 */

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

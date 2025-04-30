import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { CommentController } from './comments.controller'; // Nome corrigido
import { CommentService } from './comments.service'; // Nome corrigido
import { CommentRepository } from './comments.repository'; // Nome corrigido

/**
 * Responsabilidades:
 * - Disponibiliza endpoints REST para operações de comentários.            
 * - Gerencia dependências de serviço, repositório e cache.
 *  - Exporta o serviço de comentários para uso em outros módulos.
 *
 * Estrutura:
 * - Controller: CommentController
 * - Service: CommentService
 * - Repository: CommentRepository
 * - Integração com DynamoDbService (global) e CacheModule
 *
 * @module CommentsModule       
 * 
 */

/**
 * Módulo responsável por agrupar todos os componentes relacionados a comentários.
 * Inclui controller, service, repository e configuração de cache.
 * Exporta o serviço para uso em outros módulos da aplicação.
 */
@Module({
    imports: [
        CacheModule.register({
            ttl: 300,
            max: 100,
        }),
    ],
    controllers: [CommentController], // Nome corrigido
    providers: [CommentService, CommentRepository], // Nomes corrigidos
    exports: [CommentService], // Nome corrigido
})
export class CommentsModule { }
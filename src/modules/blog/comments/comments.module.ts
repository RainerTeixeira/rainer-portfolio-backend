import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';

/**
 * Responsabilidades:
 * - Disponibiliza endpoints REST para operações de comentários.            
 * - Gerencia dependências de serviço, repositório e cache.
 *  - Exporta o serviço de comentários para uso em outros módulos.
 *
 * Estrutura:
 * - Controller: CommentsController
 * - Service: CommentsService
 * - Repository: CommentsRepository
 * - Integração com DynamoDbService (global) e CacheModule
 *
 * @module CommentsModule       
 * 
 */

@Module({
    imports: [
        // Cache local (se você quiser uma config diferente da global)
        CacheModule.register({
            ttl: 300,
            max: 100,
        }),
    ],
    controllers: [CommentsController],
    providers: [CommentsService, CommentsRepository],
    exports: [CommentsService],
})
export class CommentsModule { }
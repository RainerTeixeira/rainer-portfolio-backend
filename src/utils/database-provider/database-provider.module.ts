/**
 * Módulo para funcionalidade de seleção de database provider
 * 
 * Exporta serviços e interceptors para gerenciar a escolha
 * dinâmica entre Prisma e DynamoDB.
 * 
 * @module utils/database-provider/database-provider.module
 */

import { Module, Global } from '@nestjs/common';
import { DatabaseProviderContextService } from './database-provider-context.service.js';
import { DatabaseProviderInterceptor } from './database-provider.interceptor.js';

/**
 * Módulo global para database provider
 * 
 * Torna o DatabaseContextService disponível em toda aplicação
 * sem precisar importar em cada módulo.
 */
@Global()
@Module({
  providers: [
    DatabaseProviderContextService,
    DatabaseProviderInterceptor,
  ],
  exports: [
    DatabaseProviderContextService,
    DatabaseProviderInterceptor,
  ],
})
export class DatabaseProviderModule {}


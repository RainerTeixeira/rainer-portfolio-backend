/**
 * Health Module
 * 
 * Módulo NestJS para health check da aplicação.
 * 
 * ⚠️ IMPORTANTE: Este módulo importa explicitamente o DatabaseProviderModule
 * mesmo ele sendo @Global() para garantir que as dependências sejam
 * resolvidas corretamente durante a inicialização do NestJS.
 * 
 * @module modules/health/health.module
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { HealthService } from './health.service.js';
import { HealthRepository } from './health.repository.js';
import { DatabaseProviderModule } from '../../utils/database-provider/index.js';

/**
 * Módulo de Health Check
 * 
 * Providers:
 * - HealthService: Lógica de negócio para health check
 * - HealthRepository: Acesso a informações do sistema
 * 
 * Controllers:
 * - HealthController: Rotas de health check (/health, /health/detailed)
 * 
 * Imports:
 * - DatabaseProviderModule: Necessário para injeção do DatabaseProviderContextService
 */
@Module({
  imports: [DatabaseProviderModule], // Importação explícita para resolver dependências
  controllers: [HealthController],
  providers: [HealthService, HealthRepository],
  exports: [HealthService, HealthRepository],
})
export class HealthModule {}


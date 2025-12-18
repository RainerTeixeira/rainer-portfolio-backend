/**
 * @fileoverview Módulo de Health Check
 * 
 * Módulo responsável por monitorar a saúde da aplicação,
 * verificando status dos serviços e dependências.
 * 
 * @module modules/health/health.module
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './services/health.service';

/**
 * Módulo de verificação de saúde da aplicação.
 * 
 * Responsável por:
 * - Verificar status da aplicação
 * - Monitorar dependências (banco, serviços externos)
 * - Prover métricas de saúde
 * - Suportar load balancers e orchestrators
 * 
 * Endpoints:
 * - GET /health - Health check básico
 * - GET /health/detailed - Health check detalhado
 * 
 * @class HealthModule
 * 
 * @example
 * ```typescript
 * // Resposta do health check
 * {
 *   status: 'ok',
 *   timestamp: '2023-01-01T00:00:00.000Z',
 *   uptime: 3600,
 *   version: '1.0.0'
 * }
 * ```
 * 
 * @since 1.0.0
 */
@Module({
  /**
   * Controllers do módulo.
   */
  controllers: [HealthController],
  
  /**
   * Providers disponíveis para injeção.
   */
  providers: [HealthService],
  
  /**
   * Exporta para uso em outros módulos.
   */
  exports: [HealthService],
})
export class HealthModule {}


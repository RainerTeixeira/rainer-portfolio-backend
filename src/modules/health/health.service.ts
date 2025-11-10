/**
 * Serviço de Health Check
 * 
 * Lógica de negócio para health check da API.
 * 
 * @module modules/health/health.service
 */

import { Injectable } from '@nestjs/common';
import { HealthRepository } from './health.repository.js';
import { DatabaseProviderContextService } from '../../utils/database-provider/index.js';
import type { HealthStatus, DetailedHealthStatus } from './health.model.js';

/**
 * HealthService
 *
 * Fornece status básico e detalhado da API, memória e banco de dados.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly healthRepository: HealthRepository,
    private readonly databaseProviderContext: DatabaseProviderContextService,
  ) {}

  /**
   * Retorna status básico da API e contexto do provedor de banco.
   *
   * Inclui informações de versão, timestamp, serviço e provedor de banco atual.
   *
   * @returns `HealthStatus` com campos principais de disponibilidade.
   */
  async getBasicHealth(): Promise<HealthStatus> {
    const provider = this.databaseProviderContext.getProvider();
    const description = this.databaseProviderContext.getEnvironmentDescription();
    
    const result: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Blog API NestJS',
      version: '5.0.0', 
      database: {
        provider: provider,
        description: description,
      },
    };
    
    return result;
  }

  /**
   * Retorna status detalhado do serviço.
   *
   * Inclui métricas de memória, uptime, informações do banco (provedor atual,
   * descrição, lista de provedores disponíveis) e metadados do ambiente.
   *
   * @returns `DetailedHealthStatus` com métricas e contexto de ambiente.
   */
  async getDetailedHealth(): Promise<DetailedHealthStatus> {
    const memory = this.healthRepository.getMemoryUsage();
    const uptime = this.healthRepository.getUptime();
    const database = this.healthRepository.getDatabaseStatus();
    const envInfo = this.databaseProviderContext.getEnvironmentInfo();

    const result: DetailedHealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Blog API NestJS',
      version: '5.0.0',
      uptime,
      memory,
      database: {
        ...database,
        currentProvider: envInfo.provider,
        description: envInfo.description,
        available: ['PRISMA', 'DYNAMODB'],
        environment: envInfo,
      },
    };
    
    return result;
  }
}


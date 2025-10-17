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

@Injectable()
export class HealthService {
  constructor(
    private readonly healthRepository: HealthRepository,
    private readonly databaseProviderContext: DatabaseProviderContextService,
  ) {}

  getBasicHealth(): HealthStatus {
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

  getDetailedHealth(): DetailedHealthStatus {
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


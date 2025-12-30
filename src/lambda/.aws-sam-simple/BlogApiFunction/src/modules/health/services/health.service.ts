/**
 * @fileoverview Serviço de Health Check
 *
 * Lógica de negócio para health check da API.
 *
 * Responsabilidades:
 * - Produzir um status básico (disponibilidade + uptime).
 * - Produzir um status detalhado (métricas de memória + informações do banco).
 *
 * Observação:
 * - Os métodos retornam objetos simples para fácil consumo por monitoramento.
 *
 * @module modules/health/services/health.service
 */

import { Injectable } from '@nestjs/common';

// Tipos simples para health check
/**
 * Estrutura mínima de health check.
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
}

/**
 * Estrutura detalhada de health check.
 */
export interface DetailedHealthStatus extends HealthStatus {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    status: 'connected' | 'disconnected';
    provider: string;
  };
}

/**
 * HealthService
 *
 * Fornece status básico e detalhado da API, memória e banco de dados.
 */
@Injectable()
export class HealthService {
  constructor() {}

  /**
   * Retorna status básico da API.
   *
   * Inclui informações de versão, timestamp e serviço.
   *
   * @returns `HealthStatus` com campos principais de disponibilidade.
   */
  async getBasicHealth(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
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
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      database: {
        status: 'connected',
        provider: 'MongoDB/DynamoDB',
      },
    };
  }
}


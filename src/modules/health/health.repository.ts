/**
 * Repositório de Health Check
 * 
 * Camada de acesso a dados do sistema para health check.
 * 
 * @module modules/health/health.repository
 */

import { Injectable } from '@nestjs/common';
import type { MemoryUsage, DatabaseStatus } from './health.model.js';
import { env } from '../../config/env.js';

@Injectable()
export class HealthRepository {
  /** Retorna uso de memória do processo. */
  getMemoryUsage(): MemoryUsage {
    return process.memoryUsage();
  }

  /** Retorna tempo de atividade do processo (segundos). */
  getUptime(): number {
    return process.uptime();
  }

  /** Retorna status do banco de dados (provider e status). */
  getDatabaseStatus(): DatabaseStatus {
    return {
      provider: env.DATABASE_PROVIDER,
      status: 'connected',
    };
  }

  /** Retorna versão do Node.js. */
  getNodeVersion(): string {
    return process.version;
  }

  /** Retorna plataforma do sistema operacional. */
  getPlatform(): string {
    return process.platform;
  }

  /** Retorna ID do processo. */
  getProcessId(): number {
    return process.pid;
  }
}


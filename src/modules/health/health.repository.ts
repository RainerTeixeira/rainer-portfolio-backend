/**
 * Repository de Health Check
 * 
 * Camada de acesso a dados do sistema para health check.
 * 
 * @module modules/health/health.repository
 */

import { Injectable } from '@nestjs/common';
import type { MemoryUsage, DatabaseStatus } from './health.model.js';

@Injectable()
export class HealthRepository {
  getMemoryUsage(): MemoryUsage {
    return process.memoryUsage();
  }

  getUptime(): number {
    return process.uptime();
  }

  getDatabaseStatus(): DatabaseStatus {
    return {
      provider: process.env.DATABASE_PROVIDER || 'PRISMA',
      status: 'connected',
    };
  }

  getNodeVersion(): string {
    return process.version;
  }

  getPlatform(): string {
    return process.platform;
  }

  getProcessId(): number {
    return process.pid;
  }
}


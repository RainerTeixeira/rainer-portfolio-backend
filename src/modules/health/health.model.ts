/**
 * Modelo de Health Check
 * 
 * Define a estrutura de dados para health check da API.
 * 
 * @module modules/health/health.model
 */

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  service: string;
  version: string;
  database?: {
    provider: string;
    description: string;
  };
}

export interface DetailedHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  memory: MemoryUsage;
  database: DatabaseStatus;
}

export interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
}

export interface DatabaseStatus {
  provider: string;
  status: string;
  currentProvider?: string;
  description?: string;
  available?: string[];
  environment?: any;
}


/**
 * Schemas de Validação de Health Check
 * 
 * Este módulo define schemas de validação para endpoints de health check.
 * Embora health check seja público e sem autenticação, validar query params
 * e responses garante type-safety e documentação.
 * 
 * Schemas disponíveis:
 * - healthQuerySchema: Validação de query params (opcional)
 * - healthResponseSchema: Estrutura de resposta básica
 * - detailedHealthResponseSchema: Estrutura de resposta detalhada
 * 
 * @fileoverview Schemas Zod para validação de health check
 * @module schemas/health
 * @version 1.0.0
 * @since 2.0.0
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE QUERY PARAMS (OPCIONAL)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Schema de validação para query params de health check
 * 
 * Permite configurar formato da resposta.
 * 
 * @type {z.ZodObject}
 * @constant
 * 
 * @example
 * GET /health?format=json
 * GET /health?includeMetrics=true
 */
export const healthQuerySchema = z.object({
  /** Formato da resposta (json, text, xml) */
  format: z.enum(['json', 'text', 'xml']).optional().default('json'),
  
  /** Incluir métricas básicas */
  includeMetrics: z.coerce.boolean().optional().default(false),
}).optional();

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE RESPOSTA BÁSICA
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Schema da resposta de health check básico
 * 
 * Define estrutura esperada da resposta GET /health
 * 
 * @type {z.ZodObject}
 * @constant
 */
export const healthResponseSchema = z.object({
  /** Status da aplicação */
  status: z.enum(['ok', 'degraded', 'error']),
  
  /** Nome do serviço */
  service: z.string(),
  
  /** Timestamp ISO 8601 da verificação */
  timestamp: z.string().datetime(),
  
  /** Tempo de atividade em segundos */
  uptime: z.number().positive(),
  
  /** Ambiente de execução */
  environment: z.string(),
  
  /** Versão da API */
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
});

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DE RESPOSTA DETALHADA
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Schema da resposta de health check detalhado
 * 
 * Define estrutura esperada da resposta GET /health/detailed
 * Inclui métricas de sistema e informações do processo.
 * 
 * @type {z.ZodObject}
 * @constant
 */
export const detailedHealthResponseSchema = healthResponseSchema.extend({
  /** Métricas de uso de memória */
  memory: z.object({
    /** Resident Set Size (memória total) */
    rss: z.string().regex(/^\d+ MB$/),
    
    /** Heap total alocado */
    heapTotal: z.string().regex(/^\d+ MB$/),
    
    /** Heap utilizado */
    heapUsed: z.string().regex(/^\d+ MB$/),
  }),
  
  /** Informações do processo Node.js */
  process: z.object({
    /** Process ID */
    pid: z.number().positive(),
    
    /** Sistema operacional */
    platform: z.string(),
    
    /** Versão do Node.js */
    nodeVersion: z.string().regex(/^v\d+\.\d+\.\d+/),
  }),
});

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS TYPESCRIPT INFERIDOS
// ═══════════════════════════════════════════════════════════════════════════

/** Tipo para query params de health check */
export type HealthQuery = z.infer<typeof healthQuerySchema>;

/** Tipo para resposta básica de health */
export type HealthResponse = z.infer<typeof healthResponseSchema>;

/** Tipo para resposta detalhada de health */
export type DetailedHealthResponse = z.infer<typeof detailedHealthResponseSchema>;


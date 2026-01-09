/**
 * @fileoverview Controller de Health Check
 *
 * Endpoints HTTP para verificação de saúde (health check) da API.
 *
 * Objetivos:
 * - Fornecer um endpoint simples para monitoramento (liveness).
 * - Fornecer um endpoint mais detalhado para troubleshooting (métricas básicas).
 *
 * @module modules/health/controllers/health.controller
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from '../services/health.service';

/**
 * HealthController
 *
 * Endpoints de health check básico e detalhado da API.
 *
 * Convenções de resposta:
 * - `{ success: true, data }` para respostas bem-sucedidas.
 * - Usa `X-Database-Provider` via `DatabaseProviderHeader` para alternar contexto.
 *
 * Integração Swagger:
 * - `@ApiTags` e `@ApiOperation` com descrições e exemplos.
 *
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Retorna status básico da API.
   *
   * @returns {Promise<{ success: true; data: unknown }>} Envelope com status básico.
   */
  @Get()
  @ApiOperation({ 
    summary: '❤️ Health Check',
    description: 'Health check básico da API.',
  })
  async getHealth() {
    const health = await this.healthService.getBasicHealth();
    return { success: true, data: health };
  }

  /**
   * Retorna status detalhado: memória, uptime e dados do banco.
   *
   * @returns {Promise<{ success: true; data: unknown }>} Envelope com status detalhado.
   */
  @Get('detailed')
  @ApiOperation({ 
    summary: '🔍 Health Check Detalhado',
    description: 'Health check com informações detalhadas incluindo métricas de memória e uptime.',
  })
  async getDetailedHealth() {
    const health = await this.healthService.getDetailedHealth();
    return { success: true, data: health };
  }
}


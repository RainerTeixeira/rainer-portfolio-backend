/**
 * Controlador de Health Check
 *
 * Endpoints para health check básico e detalhado da API.
 *
 * @module modules/health/health.controller
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service.js';
import { DatabaseProviderHeader } from '../../utils/database-provider/index.js';

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
@ApiTags('❤️ Health Check')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Retorna status básico da API e contexto do provedor de banco.
   */
  @Get()
  @DatabaseProviderHeader()
  @ApiOperation({ 
    summary: '❤️ Health Check',
    description: 'Health check básico. Use o header X-Database-Provider para testar a seleção de banco.',
  })
  async getHealth() {
    const health = await this.healthService.getBasicHealth();
    return { success: true, data: health };
  }

  /**
   * Retorna status detalhado: memória, uptime e dados do banco/ambiente.
   */
  @Get('detailed')
  @DatabaseProviderHeader()
  @ApiOperation({ 
    summary: '🔍 Health Check Detalhado',
    description: 'Health check com informações detalhadas incluindo qual banco está sendo usado.',
  })
  async getDetailedHealth() {
    const health = await this.healthService.getDetailedHealth();
    return { success: true, data: health };
  }
}


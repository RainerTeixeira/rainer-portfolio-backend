import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service.js';
import { DatabaseProviderHeader } from '../../utils/database-provider/index.js';

@ApiTags('❤️ Health Check')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @DatabaseProviderHeader()
  @ApiOperation({ 
    summary: '❤️ Health Check',
    description: 'Health check básico. Use o header X-Database-Provider para testar a seleção de banco.',
  })
  getHealth() {
    const health = this.healthService.getBasicHealth();
    return { success: true, data: health };
  }

  @Get('detailed')
  @DatabaseProviderHeader()
  @ApiOperation({ 
    summary: '🔍 Health Check Detalhado',
    description: 'Health check com informações detalhadas incluindo qual banco está sendo usado.',
  })
  getDetailedHealth() {
    const health = this.healthService.getDetailedHealth();
    return { success: true, data: health };
  }
}


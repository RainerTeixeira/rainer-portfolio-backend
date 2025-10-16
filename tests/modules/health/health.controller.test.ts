/**
 * Testes Unitários: Health Controller
 * 
 * Testa todos os endpoints do controller de health check.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../../src/modules/health/health.controller';
import { HealthService } from '../../../src/modules/health/health.service';
import type { HealthStatus, DetailedHealthStatus } from '../../../src/modules/health/health.model';

describe('HealthController', () => {
  let controller: HealthController;
  let service: jest.Mocked<HealthService>;

  const mockBasicHealth: HealthStatus = {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    service: 'Blog API NestJS',
    version: '5.0.0',
  };

  const mockDetailedHealth: DetailedHealthStatus = {
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    service: 'Blog API NestJS',
    version: '5.0.0',
    uptime: 3600,
    memory: {
      rss: 50000000,
      heapTotal: 30000000,
      heapUsed: 20000000,
      external: 1000000,
    },
    database: {
      provider: 'PRISMA',
      status: 'connected',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            getBasicHealth: jest.fn(),
            getDetailedHealth: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get(HealthService) as jest.Mocked<HealthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('getHealth', () => {
    it('deve retornar status de saúde básico do servidor', async () => {
      service.getBasicHealth.mockReturnValue(mockBasicHealth);

      const result = await controller.getHealth();

      expect(service.getBasicHealth).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: mockBasicHealth });
    });
  });

  describe('getDetailedHealth', () => {
    it('deve retornar status de saúde detalhado', async () => {
      service.getDetailedHealth.mockReturnValue(mockDetailedHealth);

      const result = await controller.getDetailedHealth();

      expect(service.getDetailedHealth).toHaveBeenCalled();
      expect(result).toEqual({ success: true, data: mockDetailedHealth });
    });
  });
});

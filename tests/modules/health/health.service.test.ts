/**
 * Testes Unitários: Health Service
 * 
 * Testa a lógica de health check da aplicação.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../../../src/modules/health/health.service';
import { HealthRepository } from '../../../src/modules/health/health.repository';
import { DatabaseProviderContextService } from '../../../src/utils/database-provider/database-provider-context.service';

describe('HealthService', () => {
  let service: HealthService;
  let repository: jest.Mocked<HealthRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: HealthRepository,
          useValue: {
            getMemoryUsage: jest.fn(),
            getUptime: jest.fn(),
            getDatabaseStatus: jest.fn(),
            getNodeVersion: jest.fn(),
            getPlatform: jest.fn(),
            getProcessId: jest.fn(),
          },
        },
        {
          provide: DatabaseProviderContextService,
          useValue: {
            getProvider: jest.fn().mockReturnValue('PRISMA'),
            getEnvironmentDescription: jest.fn().mockReturnValue('MongoDB + Prisma (Local)'),
            getEnvironmentInfo: jest.fn().mockReturnValue({
              provider: 'PRISMA',
              description: 'MongoDB + Prisma (Local)',
              isDynamoDBLocal: false,
            }),
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    repository = module.get(HealthRepository) as jest.Mocked<HealthRepository>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getBasicHealth', () => {
    it('deve retornar status básico de saúde', () => {
      const result = service.getBasicHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'Blog API NestJS');
      expect(result).toHaveProperty('version', '5.0.0');
      expect(result).toHaveProperty('timestamp');
    });

    it('deve retornar timestamp válido', () => {
      const result = service.getBasicHealth();
      
      const timestamp = new Date(result.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('deve retornar status ok', () => {
      const result = service.getBasicHealth();
      
      expect(result.status).toBe('ok');
    });

    it('não deve chamar repository para health básico', () => {
      service.getBasicHealth();

      expect(repository.getMemoryUsage).not.toHaveBeenCalled();
      expect(repository.getUptime).not.toHaveBeenCalled();
      expect(repository.getDatabaseStatus).not.toHaveBeenCalled();
    });
  });

  describe('getDetailedHealth', () => {
    const mockMemory = {
      rss: 50000000,
      heapTotal: 30000000,
      heapUsed: 20000000,
      external: 1000000,
      arrayBuffers: 500000,
    };

    const mockDatabase = {
      provider: 'PRISMA',
      status: 'connected' as const,
    };

    beforeEach(() => {
      repository.getMemoryUsage.mockReturnValue(mockMemory);
      repository.getUptime.mockReturnValue(3600);
      repository.getDatabaseStatus.mockReturnValue(mockDatabase);
    });

    it('deve retornar status detalhado de saúde', () => {
      const result = service.getDetailedHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'Blog API NestJS');
      expect(result).toHaveProperty('version', '5.0.0');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('database');
    });

    it('deve chamar repository para obter informações', () => {
      service.getDetailedHealth();

      expect(repository.getMemoryUsage).toHaveBeenCalledTimes(1);
      expect(repository.getUptime).toHaveBeenCalledTimes(1);
      expect(repository.getDatabaseStatus).toHaveBeenCalledTimes(1);
    });

    it('deve retornar uptime correto', () => {
      const result = service.getDetailedHealth();

      expect(result.uptime).toBe(3600);
    });

    it('deve retornar informações de memória', () => {
      const result = service.getDetailedHealth();

      expect(result.memory).toEqual(mockMemory);
      expect(result.memory.heapUsed).toBeLessThanOrEqual(result.memory.heapTotal);
    });

    it('deve retornar status do banco de dados', () => {
      const result = service.getDetailedHealth();

      expect(result.database).toHaveProperty('provider', 'PRISMA');
      expect(result.database).toHaveProperty('status', 'connected');
      expect(result.database).toHaveProperty('description');
    });

    it('deve incluir todas as informações básicas', () => {
      const result = service.getDetailedHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('Blog API NestJS');
      expect(result.version).toBe('5.0.0');
    });

    it('deve gerar timestamp recente', () => {
      const beforeTime = new Date().getTime();
      const result = service.getDetailedHealth();
      const afterTime = new Date().getTime();

      const timestamp = new Date(result.timestamp).getTime();
      
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});


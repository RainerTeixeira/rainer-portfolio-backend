/**
 * Testes do Health Service com Banco Real
 * 
 * Testa a lógica de health check usando banco real.
 * Minimiza mocks - apenas DatabaseProviderContextService (necessário para contexto).
 * 
 * Cobertura: 100%
 */

import { TestingModule } from '@nestjs/testing';
import { HealthService } from '../../../src/modules/health/health.service';
import { HealthModule } from '../../../src/modules/health/health.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { DatabaseProviderContextService } from '../../../src/utils/database-provider/database-provider-context.service';
import {
  createDatabaseTestModule,
  cleanDatabase,
} from '../../helpers/database-test-helper';

describe('HealthService (Banco Real)', () => {
  let service: HealthService;
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await createDatabaseTestModule({
      imports: [HealthModule],
      providers: [
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
    });

    service = module.get<HealthService>(HealthService);
    prisma = module.get<PrismaService>(PrismaService);

    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await module.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getBasicHealth', () => {
    it('deve retornar status básico de saúde', async () => {
      const result = await service.getBasicHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'Blog API NestJS');
      expect(result).toHaveProperty('version', '5.0.0');
      expect(result).toHaveProperty('timestamp');
    });

    it('deve retornar timestamp válido', async () => {
      const result = await service.getBasicHealth();
      
      const timestamp = new Date(result.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('deve retornar status ok', async () => {
      const result = await service.getBasicHealth();
      
      expect(result.status).toBe('ok');
    });
  });

  describe('getDetailedHealth', () => {
    it('deve retornar status detalhado de saúde', async () => {
      const result = await service.getDetailedHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'Blog API NestJS');
      expect(result).toHaveProperty('version', '5.0.0');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('database');
    });

    it('deve retornar uptime válido', async () => {
      const result = await service.getDetailedHealth();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('deve retornar informações de memória válidas', async () => {
      const result = await service.getDetailedHealth();

      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory.heapUsed).toBeLessThanOrEqual(result.memory.heapTotal);
    });

    it('deve retornar status do banco de dados', async () => {
      const result = await service.getDetailedHealth();

      expect(result.database).toHaveProperty('provider');
      expect(result.database).toHaveProperty('status');
      expect(result.database.status).toBe('connected');
    });

    it('deve incluir todas as informações básicas', async () => {
      const result = await service.getDetailedHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('Blog API NestJS');
      expect(result.version).toBe('5.0.0');
    });

    it('deve gerar timestamp recente', async () => {
      const beforeTime = new Date().getTime();
      const result = await service.getDetailedHealth();
      const afterTime = new Date().getTime();

      const timestamp = new Date(result.timestamp).getTime();
      
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});

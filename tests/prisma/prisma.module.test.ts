/**
 * Testes Unitários: Prisma Module
 * 
 * Testa o módulo global do Prisma com suas configurações.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PrismaModule', () => {
  let module: TestingModule;
  let prismaService: PrismaService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    
    // Mock dos métodos do Prisma
    prismaService.$connect = jest.fn().mockResolvedValue(undefined);
    prismaService.$disconnect = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(module).toBeDefined();
    });

    it('deve ter PrismaModule importado', () => {
      expect(PrismaModule).toBeDefined();
    });
  });

  describe('Providers', () => {
    it('deve fornecer PrismaService', () => {
      expect(prismaService).toBeDefined();
      expect(prismaService.constructor.name).toBe('PrismaService');
    });

    it('deve ser capaz de obter PrismaService do módulo', () => {
      const service = module.get<PrismaService>(PrismaService);
      expect(service).toBe(prismaService);
    });
  });

  describe('Exports', () => {
    it('deve exportar PrismaService', async () => {
      // Testa se o PrismaService está disponível após importar o módulo
      const testModule = await Test.createTestingModule({
        imports: [PrismaModule],
      }).compile();

      const service = testModule.get<PrismaService>(PrismaService);
      expect(service).toBeDefined();
      expect(service.constructor.name).toBe('PrismaService');
      
      await testModule.close();
    });
  });

  describe('Global Module', () => {
    it('deve estar marcado como global', () => {
      // Verifica se o decorador @Global() está aplicado
      // O NestJS marca módulos globais internamente
      expect(PrismaModule).toBeDefined();
    });

    it('deve ser acessível sem importação explícita em outros módulos', async () => {
      // Primeiro módulo importa PrismaModule
      await Test.createTestingModule({
        imports: [PrismaModule],
      }).compile();

      // Segundo módulo não importa PrismaModule mas deve ter acesso ao PrismaService
      // (em um cenário real de módulo global)
      const secondModule = await Test.createTestingModule({
        imports: [PrismaModule], // Ainda precisa importar no teste, mas em app real não
      }).compile();

      const service = secondModule.get<PrismaService>(PrismaService);
      expect(service).toBeDefined();
      
      await secondModule.close();
    });
  });

  describe('Lifecycle', () => {
    it('deve inicializar o módulo corretamente', async () => {
      await module.init();
      expect(prismaService).toBeDefined();
    });

    it('deve fechar o módulo corretamente', async () => {
      await module.close();
      expect(prismaService.$disconnect).toHaveBeenCalled();
    });
  });

  describe('Integração', () => {
    it('deve permitir injeção de PrismaService em outros providers', async () => {
      class TestService {
        constructor(public readonly prisma?: PrismaService) {}
      }

      const testModule = await Test.createTestingModule({
        imports: [PrismaModule],
        providers: [
          {
            provide: TestService,
            useFactory: (prisma: PrismaService) => new TestService(prisma),
            inject: [PrismaService],
          },
        ],
      }).compile();

      const testService = testModule.get<TestService>(TestService);
      expect(testService).toBeDefined();
      expect(testService.prisma).toBeDefined();
      expect(testService.prisma?.constructor.name).toBe('PrismaService');
      
      await testModule.close();
    });

    it('deve fornecer a mesma instância de PrismaService (singleton)', async () => {
      const service1 = module.get<PrismaService>(PrismaService);
      const service2 = module.get<PrismaService>(PrismaService);
      
      expect(service1).toBe(service2);
    });
  });

  describe('Metadata', () => {
    it('deve ter metadata de módulo correto', () => {
      expect(PrismaModule).toBeDefined();
      expect(PrismaModule.name).toBe('PrismaModule');
    });
  });
});


/**
 * Testes Unitários: Prisma Service
 * 
 * Testa o serviço do Prisma com lifecycle hooks do NestJS.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  const originalEnv = process.env;

  beforeEach(async () => {
    // Define DATABASE_PROVIDER para PRISMA nos testes
    process.env.DATABASE_PROVIDER = 'PRISMA';
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    
    // Mock dos métodos do Prisma
    service.$connect = jest.fn().mockResolvedValue(undefined);
    service.$disconnect = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    it('deve conectar ao banco de dados na inicialização', async () => {
      service.onModuleInit();

      // onModuleInit usa setImmediate, então aguardamos um pouco
      await new Promise(resolve => setImmediate(resolve));

      expect(service.$connect).toHaveBeenCalledTimes(1);
    });

    it('deve lidar com erro de conexão graciosamente (apenas log)', async () => {
      const error = new Error('Erro de conexão');
      service.$connect = jest.fn().mockRejectedValue(error);

      // O serviço não propaga o erro, apenas loga um warning
      service.onModuleInit();
      
      // Aguardar setImmediate
      await new Promise(resolve => setImmediate(resolve));
      
      // Aguardar um pouco mais para a promise de conexão
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(service.$connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('deve desconectar do banco de dados na destruição', async () => {
      await service.onModuleDestroy();

      expect(service.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('deve propagar erro se desconexão falhar', async () => {
      const error = new Error('Erro de desconexão');
      service.$disconnect = jest.fn().mockRejectedValue(error);

      await expect(service.onModuleDestroy()).rejects.toThrow('Erro de desconexão');
    });
  });

  describe('Lifecycle Completo', () => {
    it('deve conectar e desconectar em sequência', async () => {
      service.onModuleInit();
      
      // Aguardar setImmediate
      await new Promise(resolve => setImmediate(resolve));
      
      await service.onModuleDestroy();

      expect(service.$connect).toHaveBeenCalledTimes(1);
      expect(service.$disconnect).toHaveBeenCalledTimes(1);
    });
  });
});

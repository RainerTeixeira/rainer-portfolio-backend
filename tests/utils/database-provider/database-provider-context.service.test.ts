/**
 * Testes Unitários: Database Provider Context Service
 * 
 * Testa o serviço de contexto do database provider.
 * Cobertura: AsyncLocalStorage, detecção de ambiente, getters
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseProviderContextService, DatabaseProvider } from '../../../src/utils/database-provider/database-provider-context.service';

describe('DatabaseProviderContextService', () => {
  let service: DatabaseProviderContextService;
  const originalEnv = process.env;

  beforeEach(async () => {
    jest.resetModules();
    process.env = { ...originalEnv };
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseProviderContextService],
    }).compile();

    service = module.get<DatabaseProviderContextService>(DatabaseProviderContextService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(service).toBeDefined();
    });

    it('deve ter AsyncLocalStorage configurado', () => {
      expect(service['asyncLocalStorage']).toBeDefined();
    });
  });

  describe('setProvider e getProvider', () => {
    it('deve definir e obter PRISMA dentro de um contexto', () => {
      service.run('PRISMA', () => {
        service.setProvider('PRISMA');
        const provider = service.getProvider();
        expect(provider).toBe('PRISMA');
      });
    });

    it('deve definir e obter DYNAMODB dentro de um contexto', () => {
      service.run('DYNAMODB', () => {
        service.setProvider('DYNAMODB');
        const provider = service.getProvider();
        expect(provider).toBe('DYNAMODB');
      });
    });

    it('deve retornar provider do contexto quando definido', () => {
      service.run('DYNAMODB', () => {
        const provider = service.getProvider();
        expect(provider).toBe('DYNAMODB');
      });
    });

    it('deve usar fallback para PRISMA quando não há contexto e env não definido', () => {
      delete process.env.DATABASE_PROVIDER;
      const provider = service.getProvider();
      expect(provider).toBe('PRISMA');
    });

    it('deve usar fallback para DYNAMODB quando DATABASE_PROVIDER=DYNAMODB', () => {
      process.env.DATABASE_PROVIDER = 'DYNAMODB';
      const provider = service.getProvider();
      expect(provider).toBe('DYNAMODB');
    });

    it('deve usar fallback para PRISMA quando DATABASE_PROVIDER=PRISMA', () => {
      process.env.DATABASE_PROVIDER = 'PRISMA';
      const provider = service.getProvider();
      expect(provider).toBe('PRISMA');
    });

    it('deve ser case-insensitive no fallback', () => {
      process.env.DATABASE_PROVIDER = 'dynamodb';
      const provider = service.getProvider();
      expect(provider).toBe('DYNAMODB');
    });
  });

  describe('run', () => {
    it('deve executar callback dentro do contexto com PRISMA', () => {
      const result = service.run('PRISMA', () => {
        return service.getProvider();
      });
      expect(result).toBe('PRISMA');
    });

    it('deve executar callback dentro do contexto com DYNAMODB', () => {
      const result = service.run('DYNAMODB', () => {
        return service.getProvider();
      });
      expect(result).toBe('DYNAMODB');
    });

    it('deve retornar valor do callback', () => {
      const result = service.run('PRISMA', () => {
        return { test: 'value' };
      });
      expect(result).toEqual({ test: 'value' });
    });

    it('deve isolar contextos aninhados', () => {
      service.run('PRISMA', () => {
        expect(service.getProvider()).toBe('PRISMA');
        
        service.run('DYNAMODB', () => {
          expect(service.getProvider()).toBe('DYNAMODB');
        });
        
        expect(service.getProvider()).toBe('PRISMA');
      });
    });
  });

  describe('isPrisma', () => {
    it('deve retornar true quando provider é PRISMA', () => {
      service.run('PRISMA', () => {
        expect(service.isPrisma()).toBe(true);
      });
    });

    it('deve retornar false quando provider é DYNAMODB', () => {
      service.run('DYNAMODB', () => {
        expect(service.isPrisma()).toBe(false);
      });
    });
  });

  describe('isDynamoDB', () => {
    it('deve retornar true quando provider é DYNAMODB', () => {
      service.run('DYNAMODB', () => {
        expect(service.isDynamoDB()).toBe(true);
      });
    });

    it('deve retornar false quando provider é PRISMA', () => {
      service.run('PRISMA', () => {
        expect(service.isDynamoDB()).toBe(false);
      });
    });
  });

  describe('getDynamoDBEnvironment', () => {
    it('deve retornar AWS quando está na Lambda (AWS_LAMBDA_FUNCTION_NAME)', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      const env = service.getDynamoDBEnvironment();
      expect(env).toBe('AWS');
    });

    it('deve retornar AWS quando está na Lambda (AWS_EXECUTION_ENV)', () => {
      process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs18.x';
      const env = service.getDynamoDBEnvironment();
      expect(env).toBe('AWS');
    });

    it('deve retornar LOCAL quando DYNAMODB_ENDPOINT está definido', () => {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      delete process.env.AWS_EXECUTION_ENV;
      process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
      
      const env = service.getDynamoDBEnvironment();
      expect(env).toBe('LOCAL');
    });

    it('deve retornar AWS quando não está na Lambda e sem DYNAMODB_ENDPOINT', () => {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      delete process.env.AWS_EXECUTION_ENV;
      delete process.env.DYNAMODB_ENDPOINT;
      
      const env = service.getDynamoDBEnvironment();
      expect(env).toBe('AWS');
    });
  });

  describe('isDynamoDBLocal', () => {
    it('deve retornar true quando DynamoDB é local', () => {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
      
      service.run('DYNAMODB', () => {
        expect(service.isDynamoDBLocal()).toBe(true);
      });
    });

    it('deve retornar false quando DynamoDB é AWS', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      
      service.run('DYNAMODB', () => {
        expect(service.isDynamoDBLocal()).toBe(false);
      });
    });

    it('deve retornar false quando provider é PRISMA', () => {
      service.run('PRISMA', () => {
        expect(service.isDynamoDBLocal()).toBe(false);
      });
    });
  });

  describe('isDynamoDBCloud', () => {
    it('deve retornar true quando DynamoDB é AWS', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      
      service.run('DYNAMODB', () => {
        expect(service.isDynamoDBCloud()).toBe(true);
      });
    });

    it('deve retornar false quando DynamoDB é local', () => {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
      
      service.run('DYNAMODB', () => {
        expect(service.isDynamoDBCloud()).toBe(false);
      });
    });

    it('deve retornar false quando provider é PRISMA', () => {
      service.run('PRISMA', () => {
        expect(service.isDynamoDBCloud()).toBe(false);
      });
    });
  });

  describe('getEnvironmentDescription', () => {
    it('deve retornar descrição para Prisma', () => {
      service.run('PRISMA', () => {
        const desc = service.getEnvironmentDescription();
        expect(desc).toBe('MongoDB + Prisma (Local)');
      });
    });

    it('deve retornar descrição para DynamoDB Local', () => {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
      
      service.run('DYNAMODB', () => {
        const desc = service.getEnvironmentDescription();
        expect(desc).toBe('DynamoDB Local (Desenvolvimento)');
      });
    });

    it('deve retornar descrição para DynamoDB AWS', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      
      service.run('DYNAMODB', () => {
        const desc = service.getEnvironmentDescription();
        expect(desc).toBe('DynamoDB AWS (Produção)');
      });
    });

    it('deve retornar Unknown para provider inválido', () => {
      // Simula provider inválido
      service.run('PRISMA' as any, () => {
        service.setProvider('INVALID' as any);
        const desc = service.getEnvironmentDescription();
        expect(desc).toBe('Unknown');
      });
    });
  });

  describe('getEnvironmentInfo', () => {
    it('deve retornar info completa para Prisma', () => {
      process.env.DATABASE_URL = 'mongodb://localhost:27017/test';
      
      service.run('PRISMA', () => {
        const info = service.getEnvironmentInfo();
        
        expect(info.provider).toBe('PRISMA');
        expect(info.description).toBe('MongoDB + Prisma (Local)');
        expect(info.isPrisma).toBe(true);
        expect(info.isDynamoDB).toBe(false);
        expect(info.databaseUrl).toBe('(configured)');
        expect(info.dynamodbEnvironment).toBeUndefined();
      });
    });

    it('deve retornar info completa para DynamoDB Local', () => {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
      process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';
      
      service.run('DYNAMODB', () => {
        const info = service.getEnvironmentInfo();
        
        expect(info.provider).toBe('DYNAMODB');
        expect(info.description).toBe('DynamoDB Local (Desenvolvimento)');
        expect(info.isPrisma).toBe(false);
        expect(info.isDynamoDB).toBe(true);
        expect(info.dynamodbEnvironment).toBe('LOCAL');
        expect(info.isDynamoDBLocal).toBe(true);
        expect(info.isDynamoDBCloud).toBe(false);
        expect(info.endpoint).toBe('http://localhost:8000');
      });
    });

    it('deve retornar info completa para DynamoDB AWS', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      delete process.env.DYNAMODB_ENDPOINT;
      
      service.run('DYNAMODB', () => {
        const info = service.getEnvironmentInfo();
        
        expect(info.provider).toBe('DYNAMODB');
        expect(info.description).toBe('DynamoDB AWS (Produção)');
        expect(info.isPrisma).toBe(false);
        expect(info.isDynamoDB).toBe(true);
        expect(info.dynamodbEnvironment).toBe('AWS');
        expect(info.isDynamoDBLocal).toBe(false);
        expect(info.isDynamoDBCloud).toBe(true);
        expect(info.endpoint).toBe('AWS Default');
      });
    });

    it('deve mostrar "(not set)" quando DATABASE_URL não configurado', () => {
      delete process.env.DATABASE_URL;
      
      service.run('PRISMA', () => {
        const info = service.getEnvironmentInfo();
        expect(info.databaseUrl).toBe('(not set)');
      });
    });
  });

  describe('Cenários de Uso Real', () => {
    it('deve funcionar em pipeline de requisição HTTP', async () => {
      // Simula requisição com header para PRISMA
      const result1 = await service.run('PRISMA', async () => {
        // Simula processamento da requisição
        await Promise.resolve();
        return {
          provider: service.getProvider(),
          isPrisma: service.isPrisma(),
        };
      });

      expect(result1.provider).toBe('PRISMA');
      expect(result1.isPrisma).toBe(true);

      // Simula outra requisição com header para DYNAMODB
      const result2 = await service.run('DYNAMODB', async () => {
        await Promise.resolve();
        return {
          provider: service.getProvider(),
          isDynamoDB: service.isDynamoDB(),
        };
      });

      expect(result2.provider).toBe('DYNAMODB');
      expect(result2.isDynamoDB).toBe(true);
    });

    it('deve manter contexto através de chamadas assíncronas', async () => {
      const result = await service.run('PRISMA', async () => {
        expect(service.getProvider()).toBe('PRISMA');
        
        await Promise.resolve();
        expect(service.getProvider()).toBe('PRISMA');
        
        await new Promise(resolve => setTimeout(resolve, 10));
        expect(service.getProvider()).toBe('PRISMA');
        
        return service.getProvider();
      });

      expect(result).toBe('PRISMA');
    });

    it('deve suportar múltiplos contextos simultâneos', async () => {
      const promises = [
        service.run('PRISMA', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return service.getProvider();
        }),
        service.run('DYNAMODB', async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          return service.getProvider();
        }),
        service.run('PRISMA', async () => {
          await new Promise(resolve => setTimeout(resolve, 15));
          return service.getProvider();
        }),
      ];

      const results = await Promise.all(promises);
      
      expect(results[0]).toBe('PRISMA');
      expect(results[1]).toBe('DYNAMODB');
      expect(results[2]).toBe('PRISMA');
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com setProvider fora de contexto run', () => {
      // setProvider sem contexto não deve causar erro
      expect(() => service.setProvider('PRISMA')).not.toThrow();
    });

    it('deve lidar com getProvider sem contexto e sem env', () => {
      delete process.env.DATABASE_PROVIDER;
      const provider = service.getProvider();
      expect(provider).toBe('PRISMA'); // Fallback padrão
    });

    it('deve normalizar DATABASE_PROVIDER case-insensitive', () => {
      process.env.DATABASE_PROVIDER = 'prisma';
      expect(service.getProvider()).toBe('PRISMA');
      
      process.env.DATABASE_PROVIDER = 'Prisma';
      expect(service.getProvider()).toBe('PRISMA');
      
      process.env.DATABASE_PROVIDER = 'PRISMA';
      expect(service.getProvider()).toBe('PRISMA');
    });
  });
});


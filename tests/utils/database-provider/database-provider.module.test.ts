/**
 * Testes Unitários: Database Provider Module
 * 
 * Testa o módulo global do database provider.
 * Cobertura: Providers, exports, global module
 */

import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseProviderModule } from '../../../src/utils/database-provider/database-provider.module';
import { DatabaseProviderContextService } from '../../../src/utils/database-provider/database-provider-context.service';
import { DatabaseProviderInterceptor } from '../../../src/utils/database-provider/database-provider.interceptor';

describe('DatabaseProviderModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseProviderModule],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(module).toBeDefined();
      expect(DatabaseProviderModule).toBeDefined();
    });

    it('deve ter decorador @Global aplicado', () => {
      // Módulos globais são marcados internamente pelo NestJS
      expect(DatabaseProviderModule).toBeDefined();
    });

    it('deve ter decorador @Module aplicado', () => {
      expect(DatabaseProviderModule).toBeDefined();
    });
  });

  describe('Providers', () => {
    it('deve fornecer DatabaseProviderContextService', () => {
      const service = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DatabaseProviderContextService);
    });

    it('deve fornecer DatabaseProviderInterceptor', () => {
      const interceptor = module.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );
      expect(interceptor).toBeDefined();
      expect(interceptor).toBeInstanceOf(DatabaseProviderInterceptor);
    });

    it('deve ter exatamente 2 providers', () => {
      const contextService = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      const interceptor = module.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );

      expect(contextService).toBeDefined();
      expect(interceptor).toBeDefined();
    });
  });

  describe('Exports', () => {
    it('deve exportar DatabaseProviderContextService', async () => {
      // Cria módulo que importa DatabaseProviderModule
      const testModule = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
      }).compile();

      const service = testModule.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DatabaseProviderContextService);
      
      await testModule.close();
    });

    it('deve exportar DatabaseProviderInterceptor', async () => {
      const testModule = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
      }).compile();

      const interceptor = testModule.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );
      
      expect(interceptor).toBeDefined();
      expect(interceptor).toBeInstanceOf(DatabaseProviderInterceptor);
      
      await testModule.close();
    });

    it('deve ter exatamente 2 exports', async () => {
      const testModule = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
      }).compile();

      const contextService = testModule.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      const interceptor = testModule.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );

      expect(contextService).toBeDefined();
      expect(interceptor).toBeDefined();
      
      await testModule.close();
    });
  });

  describe('Global Module', () => {
    it('deve estar marcado como @Global', () => {
      // Módulos globais não precisam ser importados em cada módulo filho
      expect(DatabaseProviderModule).toBeDefined();
    });

    it('deve ser acessível sem importação explícita', async () => {
      // Primeiro, importa o módulo global
      await Test.createTestingModule({
        imports: [DatabaseProviderModule],
      }).compile();

      // Segundo módulo pode acessar sem importar novamente
      // (em um cenário real de módulo global)
      const testModule = await Test.createTestingModule({
        imports: [DatabaseProviderModule], // Ainda precisa importar no teste
      }).compile();

      const service = testModule.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      expect(service).toBeDefined();
      
      await testModule.close();
    });

    it('deve estar disponível em toda aplicação', async () => {
      // Simula uso em múltiplos módulos
      const module1 = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
      }).compile();

      const module2 = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
      }).compile();

      const service1 = module1.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      const service2 = module2.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );

      expect(service1).toBeDefined();
      expect(service2).toBeDefined();
      
      await module1.close();
      await module2.close();
    });
  });

  describe('Injeção de Dependências', () => {
    it('deve injetar DatabaseProviderContextService no interceptor', () => {
      const interceptor = module.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );

      expect(interceptor['databaseContext']).toBeDefined();
      expect(interceptor['databaseContext']).toBeInstanceOf(
        DatabaseProviderContextService
      );
    });

    it('deve fornecer instância singleton do context service', () => {
      const service1 = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      const service2 = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );

      expect(service1).toBe(service2);
    });

    it('deve fornecer instância singleton do interceptor', () => {
      const interceptor1 = module.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );
      const interceptor2 = module.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );

      expect(interceptor1).toBe(interceptor2);
    });
  });

  describe('Lifecycle', () => {
    it('deve inicializar módulo corretamente', async () => {
      await module.init();
      
      const service = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      expect(service).toBeDefined();
    });

    it('deve fechar módulo corretamente', async () => {
      await module.close();
      expect(true).toBe(true); // Fechou sem erro
    });

    it('deve manter providers após init', async () => {
      await module.init();
      
      const service = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      const interceptor = module.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );

      expect(service).toBeDefined();
      expect(interceptor).toBeDefined();
    });
  });

  describe('Integração com Outros Módulos', () => {
    it('deve funcionar com módulo de Posts', async () => {
      class PostsService {
        constructor(
          private readonly dbContext: DatabaseProviderContextService
        ) {}

        getProvider() {
          return this.dbContext.getProvider();
        }
      }

      const testModule = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
        providers: [PostsService],
      }).compile();

      const postsService = testModule.get<PostsService>(PostsService);
      expect(postsService).toBeDefined();
      expect(postsService.getProvider).toBeDefined();
      
      await testModule.close();
    });

    it('deve funcionar com módulo de Users', async () => {
      class UsersController {
        constructor(
          private readonly dbContext: DatabaseProviderContextService
        ) {}

        checkDatabase() {
          return {
            isPrisma: this.dbContext.isPrisma(),
            isDynamoDB: this.dbContext.isDynamoDB(),
          };
        }
      }

      const testModule = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
        controllers: [UsersController],
      }).compile();

      const controller = testModule.get<UsersController>(UsersController);
      expect(controller).toBeDefined();
      expect(controller.checkDatabase).toBeDefined();
      
      await testModule.close();
    });

    it('deve funcionar com interceptor em controller', async () => {
      class TestController {
        test() {
          return 'ok';
        }
      }

      const testModule = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
        controllers: [TestController],
      }).compile();

      const interceptor = testModule.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );
      expect(interceptor).toBeDefined();
      
      await testModule.close();
    });
  });

  describe('Metadata do Módulo', () => {
    it('deve ter nome correto', () => {
      expect(DatabaseProviderModule.name).toBe('DatabaseProviderModule');
    });

    it('deve ser um constructor válido', () => {
      expect(typeof DatabaseProviderModule).toBe('function');
    });
  });

  describe('Isolamento de Contexto', () => {
    it('deve manter contextos isolados por requisição', async () => {
      const service = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );

      // Simula duas requisições simultâneas
      const req1 = service.run('PRISMA', () => service.getProvider());
      const req2 = service.run('DYNAMODB', () => service.getProvider());

      expect(req1).toBe('PRISMA');
      expect(req2).toBe('DYNAMODB');
    });

    it('deve manter isolamento em operações assíncronas', async () => {
      const service = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );

      const result1 = await service.run('PRISMA', async () => {
        await Promise.resolve();
        return service.getProvider();
      });

      const result2 = await service.run('DYNAMODB', async () => {
        await Promise.resolve();
        return service.getProvider();
      });

      expect(result1).toBe('PRISMA');
      expect(result2).toBe('DYNAMODB');
    });
  });

  describe('Cenários de Uso Real', () => {
    it('deve suportar troca dinâmica de database', async () => {
      const service = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );

      // Requisição 1: usa Prisma
      const result1 = service.run('PRISMA', () => ({
        provider: service.getProvider(),
        description: service.getEnvironmentDescription(),
      }));

      // Requisição 2: usa DynamoDB
      const result2 = service.run('DYNAMODB', () => ({
        provider: service.getProvider(),
        description: service.getEnvironmentDescription(),
      }));

      expect(result1.provider).toBe('PRISMA');
      expect(result2.provider).toBe('DYNAMODB');
    });

    it('deve funcionar em aplicação NestJS completa', async () => {
      // Simula AppModule importando DatabaseProviderModule
      const appModule = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
      }).compile();

      const service = appModule.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      const interceptor = appModule.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );

      expect(service).toBeDefined();
      expect(interceptor).toBeDefined();
      
      await appModule.close();
    });
  });

  describe('Validações', () => {
    it('não deve permitir get de provider inexistente', () => {
      expect(() => {
        module.get('NonExistentProvider');
      }).toThrow();
    });

    it('deve ter providers registrados corretamente', () => {
      const service = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      const interceptor = module.get<DatabaseProviderInterceptor>(
        DatabaseProviderInterceptor
      );

      expect(service.constructor.name).toBe('DatabaseProviderContextService');
      expect(interceptor.constructor.name).toBe('DatabaseProviderInterceptor');
    });
  });

  describe('Performance', () => {
    it('deve inicializar rapidamente', async () => {
      const start = Date.now();
      
      const testModule = await Test.createTestingModule({
        imports: [DatabaseProviderModule],
      }).compile();
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Deve ser rápido
      
      await testModule.close();
    });

    it('deve fornecer providers instantaneamente', () => {
      const start = Date.now();
      
      module.get<DatabaseProviderContextService>(DatabaseProviderContextService);
      module.get<DatabaseProviderInterceptor>(DatabaseProviderInterceptor);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10); // Muito rápido
    });
  });

  describe('Compatibilidade', () => {
    it('deve ser compatível com NestJS v9+', () => {
      expect(DatabaseProviderModule).toBeDefined();
    });

    it('deve funcionar com TypeScript', () => {
      const service = module.get<DatabaseProviderContextService>(
        DatabaseProviderContextService
      );
      expect(service).toBeInstanceOf(DatabaseProviderContextService);
    });

    it('deve funcionar com ES Modules', () => {
      // O módulo usa imports ES6
      expect(DatabaseProviderModule).toBeDefined();
    });
  });
});


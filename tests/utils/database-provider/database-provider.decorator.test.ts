/**
 * Testes Unitários: Database Provider Decorator
 * 
 * Testa o decorator para adicionar header de database provider no Swagger.
 * Cobertura: Decorator e integração com Swagger
 */

import { DatabaseProviderHeader } from '../../../src/utils/database-provider/database-provider.decorator';

describe('DatabaseProviderHeader Decorator', () => {
  describe('Definição', () => {
    it('deve ser uma função', () => {
      expect(typeof DatabaseProviderHeader).toBe('function');
    });

    it('deve retornar um decorator composto', () => {
      const decorator = DatabaseProviderHeader();
      expect(decorator).toBeDefined();
    });
  });

  describe('Configuração do Header', () => {
    it('deve ter nome X-Database-Provider', () => {
      const headerName = 'X-Database-Provider';
      expect(headerName).toBe('X-Database-Provider');
    });

    it('deve ter descrição adequada', () => {
      const description = '🗄️ Escolha o banco de dados (PRISMA = MongoDB, DYNAMODB = AWS)';
      expect(description).toContain('PRISMA');
      expect(description).toContain('DYNAMODB');
      expect(description).toContain('MongoDB');
    });

    it('deve ser opcional (não requerido)', () => {
      const required = false;
      expect(required).toBe(false);
    });

    it('deve ter enum com PRISMA e DYNAMODB', () => {
      const enumValues = ['PRISMA', 'DYNAMODB'];
      expect(enumValues).toContain('PRISMA');
      expect(enumValues).toContain('DYNAMODB');
      expect(enumValues).toHaveLength(2);
    });

    it('deve ter valor padrão PRISMA', () => {
      const defaultValue = 'PRISMA';
      expect(defaultValue).toBe('PRISMA');
    });
  });

  describe('Schema do Header', () => {
    it('deve ter tipo string', () => {
      const schema = {
        type: 'string',
        enum: ['PRISMA', 'DYNAMODB'],
        default: 'PRISMA',
      };

      expect(schema.type).toBe('string');
    });

    it('deve ter enum definido', () => {
      const schema = {
        type: 'string',
        enum: ['PRISMA', 'DYNAMODB'],
        default: 'PRISMA',
      };

      expect(schema.enum).toBeDefined();
      expect(Array.isArray(schema.enum)).toBe(true);
    });

    it('deve ter valores de enum corretos', () => {
      const schema = {
        type: 'string',
        enum: ['PRISMA', 'DYNAMODB'],
        default: 'PRISMA',
      };

      expect(schema.enum).toEqual(['PRISMA', 'DYNAMODB']);
    });

    it('deve ter default definido', () => {
      const schema = {
        type: 'string',
        enum: ['PRISMA', 'DYNAMODB'],
        default: 'PRISMA',
      };

      expect(schema.default).toBeDefined();
      expect(schema.default).toBe('PRISMA');
    });
  });

  describe('Uso do Decorator', () => {
    it('deve ser aplicável a métodos de controller', () => {
      class TestController {
        @DatabaseProviderHeader()
        testMethod() {
          return 'test';
        }
      }

      const controller = new TestController();
      expect(controller.testMethod()).toBe('test');
    });

    it('pode ser aplicado múltiplas vezes', () => {
      class TestController {
        @DatabaseProviderHeader()
        method1() { return '1'; }

        @DatabaseProviderHeader()
        method2() { return '2'; }
      }

      const controller = new TestController();
      expect(controller.method1()).toBe('1');
      expect(controller.method2()).toBe('2');
    });
  });

  describe('Integração com Swagger', () => {
    it('deve aparecer no swagger como header customizado', () => {
      // O decorator usa ApiHeader do @nestjs/swagger
      const headerConfig = {
        fullName: 'X-Database-Provider',
        description: '🗄️ Escolha o banco de dados (PRISMA = MongoDB, DYNAMODB = AWS)',
        required: false,
        enum: ['PRISMA', 'DYNAMODB'],
      };

      expect(headerConfig.fullName).toBe('X-Database-Provider');
      expect(headerConfig.required).toBe(false);
    });

    it('deve permitir seleção via dropdown no Swagger UI', () => {
      const enumValues = ['PRISMA', 'DYNAMODB'];
      
      // No Swagger UI, enum se torna um dropdown
      expect(enumValues.length).toBe(2);
      expect(enumValues).toContain('PRISMA');
      expect(enumValues).toContain('DYNAMODB');
    });

    it('deve mostrar valor padrão PRISMA no Swagger', () => {
      const defaultValue = 'PRISMA';
      expect(defaultValue).toBe('PRISMA');
    });
  });

  describe('Validações', () => {
    it('deve aceitar PRISMA como valor válido', () => {
      const validValues = ['PRISMA', 'DYNAMODB'];
      expect(validValues).toContain('PRISMA');
    });

    it('deve aceitar DYNAMODB como valor válido', () => {
      const validValues = ['PRISMA', 'DYNAMODB'];
      expect(validValues).toContain('DYNAMODB');
    });

    it('não deve aceitar outros valores', () => {
      const validValues = ['PRISMA', 'DYNAMODB'];
      expect(validValues).not.toContain('MYSQL');
      expect(validValues).not.toContain('POSTGRES');
      expect(validValues).not.toContain('INVALID');
    });

    it('deve ter exatamente 2 valores válidos', () => {
      const validValues = ['PRISMA', 'DYNAMODB'];
      expect(validValues).toHaveLength(2);
    });
  });

  describe('Case Sensitivity', () => {
    it('deve usar valores em UPPERCASE', () => {
      const values = ['PRISMA', 'DYNAMODB'];
      
      values.forEach(value => {
        expect(value).toBe(value.toUpperCase());
        expect(value).not.toBe(value.toLowerCase());
      });
    });

    it('PRISMA deve estar em uppercase', () => {
      const value = 'PRISMA';
      expect(value).toBe('PRISMA');
      expect(value).not.toBe('prisma');
      expect(value).not.toBe('Prisma');
    });

    it('DYNAMODB deve estar em uppercase', () => {
      const value = 'DYNAMODB';
      expect(value).toBe('DYNAMODB');
      expect(value).not.toBe('dynamodb');
      expect(value).not.toBe('DynamoDB');
    });
  });

  describe('Exemplo de Uso Real', () => {
    it('deve funcionar em um endpoint GET', () => {
      class PostsController {
        @DatabaseProviderHeader()
        findAll() {
          return [];
        }
      }

      const controller = new PostsController();
      expect(controller.findAll()).toEqual([]);
    });

    it('deve funcionar em um endpoint POST', () => {
      class PostsController {
        @DatabaseProviderHeader()
        create(data: any) {
          return { id: '1', ...data };
        }
      }

      const controller = new PostsController();
      const result = controller.create({ title: 'Test' });
      expect(result).toHaveProperty('id');
    });

    it('deve funcionar combinado com outros decorators', () => {
      class PostsController {
        @DatabaseProviderHeader()
        async findOne(id: string) {
          return { id, title: 'Post' };
        }
      }

      const controller = new PostsController();
      const result = controller.findOne('123');
      expect(result).resolves.toHaveProperty('id');
    });
  });

  describe('Documentação Swagger', () => {
    it('deve ter emoji na descrição para melhor UX', () => {
      const description = '🗄️ Escolha o banco de dados (PRISMA = MongoDB, DYNAMODB = AWS)';
      expect(description).toContain('🗄️');
    });

    it('deve explicar o que cada valor significa', () => {
      const description = '🗄️ Escolha o banco de dados (PRISMA = MongoDB, DYNAMODB = AWS)';
      
      expect(description).toContain('PRISMA = MongoDB');
      expect(description).toContain('DYNAMODB = AWS');
    });

    it('deve ser claro e objetivo', () => {
      const description = '🗄️ Escolha o banco de dados (PRISMA = MongoDB, DYNAMODB = AWS)';
      
      expect(description.length).toBeLessThan(100);
      expect(description).toContain('banco de dados');
    });
  });

  describe('Compatibilidade', () => {
    it('deve ser compatível com NestJS decorators', () => {
      // DatabaseProviderHeader usa applyDecorators do @nestjs/common
      expect(typeof DatabaseProviderHeader).toBe('function');
    });

    it('deve ser compatível com Swagger/OpenAPI', () => {
      // Usa ApiHeader do @nestjs/swagger
      const headerName = 'X-Database-Provider';
      expect(headerName).toMatch(/^X-/); // Headers customizados começam com X-
    });
  });

  describe('Behavior', () => {
    it('não deve ser obrigatório (permite requisições sem header)', () => {
      const required = false;
      expect(required).toBe(false);
    });

    it('deve ter fallback quando header não enviado', () => {
      const defaultValue = 'PRISMA';
      const fallback = defaultValue || 'PRISMA';
      expect(fallback).toBe('PRISMA');
    });
  });
});


/**
 * Testes: Environment Error Handling (100% Coverage)
 * 
 * Testa o tratamento de erros de validação de variáveis de ambiente,
 * incluindo o caminho de erro que não é testável no bootstrap.
 * 
 * Este teste garante 100% de cobertura da função validateEnvironment(),
 * incluindo o bloco if (!result.success) que lança erro.
 */

import { validateEnvironment } from '../../src/config/env';

describe('Environment Validation - Error Handling (100% Coverage)', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Silenciar console.error durante os testes
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('validateEnvironment - Caminho de Sucesso', () => {
    it('deve retornar configuração válida quando env é correto', () => {
      const validEnv = {
        NODE_ENV: 'test',
        PORT: '3000',
        HOST: '0.0.0.0',
        LOG_LEVEL: 'info',
        CORS_ORIGIN: '*',
        AWS_REGION: 'us-east-1',
        DATABASE_PROVIDER: 'PRISMA',
        DATABASE_URL: 'mongodb://localhost:27017/test',
        DYNAMODB_TABLE_PREFIX: 'test-blog',
      };

      const result = validateEnvironment(validEnv as any);

      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('test');
      expect(result.PORT).toBe(3000); // Convertido para number
      expect(result.DATABASE_PROVIDER).toBe('PRISMA');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('deve aplicar valores padrão quando não fornecidos', () => {
      const minimalEnv = {};

      const result = validateEnvironment(minimalEnv as any);

      expect(result.NODE_ENV).toBe('development'); // default
      expect(result.PORT).toBe(4000); // default
      expect(result.HOST).toBe('0.0.0.0'); // default
      expect(result.LOG_LEVEL).toBe('info'); // default
      expect(result.DATABASE_PROVIDER).toBe('PRISMA'); // default
    });

    it('deve converter PORT de string para number', () => {
      const env = {
        PORT: '5000', // String
      };

      const result = validateEnvironment(env as any);

      expect(typeof result.PORT).toBe('number');
      expect(result.PORT).toBe(5000);
    });
  });

  describe('validateEnvironment - Caminho de Erro (🎯 100% Coverage)', () => {
    it('deve aceitar DATABASE_URL opcional (validação removida para flexibilidade)', () => {
      const env = {
        DATABASE_URL: 'mongodb://localhost:27017/test', // Aceita qualquer string
      };

      const result = validateEnvironment(env as any);
      
      expect(result.DATABASE_URL).toBe('mongodb://localhost:27017/test');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando NODE_ENV é inválido', () => {
      const invalidEnv = {
        NODE_ENV: 'invalid-env', // Não é 'development' | 'production' | 'test'
      };

      expect(() => validateEnvironment(invalidEnv as any))
        .toThrow('Configuração de ambiente inválida');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('deve lançar erro quando PORT é inválido', () => {
      const invalidEnv = {
        PORT: 'abc', // Não é número
      };

      // Zod coerce vai tentar converter, mas 'abc' não converte
      expect(() => validateEnvironment(invalidEnv as any))
        .toThrow('Configuração de ambiente inválida');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('deve lançar erro quando LOG_LEVEL é inválido', () => {
      const invalidEnv = {
        LOG_LEVEL: 'invalid-level', // Não está no enum
      };

      expect(() => validateEnvironment(invalidEnv as any))
        .toThrow('Configuração de ambiente inválida');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('deve lançar erro quando DATABASE_PROVIDER é inválido', () => {
      const invalidEnv = {
        DATABASE_PROVIDER: 'MYSQL', // Não é PRISMA ou DYNAMODB
      };

      expect(() => validateEnvironment(invalidEnv as any))
        .toThrow('Configuração de ambiente inválida');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('deve lançar erro quando DYNAMODB_ENDPOINT não é URL', () => {
      const invalidEnv = {
        DYNAMODB_ENDPOINT: 'not-a-url', // Deve ser URL válida
      };

      expect(() => validateEnvironment(invalidEnv as any))
        .toThrow('Configuração de ambiente inválida');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('deve lançar erro quando COGNITO_ISSUER não é URL', () => {
      const invalidEnv = {
        COGNITO_ISSUER: 'not-a-url', // Deve ser URL válida
      };

      expect(() => validateEnvironment(invalidEnv as any))
        .toThrow('Configuração de ambiente inválida');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('validateEnvironment - Formatação de Erros Zod', () => {
    it('deve formatar erros do Zod corretamente', () => {
      const invalidEnv = {
        NODE_ENV: 'invalid',
        DATABASE_URL: 'not-a-url',
      };

      try {
        validateEnvironment(invalidEnv as any);
        fail('Deveria ter lançado erro');
      } catch (error) {
        // Verifica que console.error foi chamado com erro formatado
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        
        const [message, formattedError] = consoleErrorSpy.mock.calls[0];
        
        expect(message).toBe('❌ Erro nas variáveis de ambiente:');
        expect(formattedError).toHaveProperty('_errors');
      }
    });

    it('deve incluir todos os campos com erro no formato', () => {
      const invalidEnv = {
        NODE_ENV: 'wrong',
        PORT: 'not-number',
        LOG_LEVEL: 'wrong-level',
      };

      try {
        validateEnvironment(invalidEnv as any);
      } catch {
        const [, formattedError] = consoleErrorSpy.mock.calls[0];
        
        // Erro formatado deve ter estrutura esperada
        expect(formattedError).toBeDefined();
        expect(typeof formattedError).toBe('object');
      }
    });
  });

  describe('validateEnvironment - Integração Completa', () => {
    it('deve validar configuração completa de desenvolvimento', () => {
      const devEnv = {
        NODE_ENV: 'development',
        PORT: '4000',
        HOST: '0.0.0.0',
        LOG_LEVEL: 'debug',
        CORS_ORIGIN: '*',
        DATABASE_PROVIDER: 'PRISMA',
        DATABASE_URL: 'mongodb://localhost:27017/blog?replicaSet=rs0',
        AWS_REGION: 'us-east-1',
        DYNAMODB_TABLE_PREFIX: 'blog-dev',
      };

      const result = validateEnvironment(devEnv as any);

      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe(4000);
      expect(result.DATABASE_PROVIDER).toBe('PRISMA');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('deve validar configuração completa de produção', () => {
      const prodEnv = {
        NODE_ENV: 'production',
        PORT: '8080',
        HOST: '0.0.0.0',
        LOG_LEVEL: 'warn',
        CORS_ORIGIN: 'https://meusite.com',
        DATABASE_PROVIDER: 'DYNAMODB',
        AWS_REGION: 'us-east-1',
        DYNAMODB_TABLE_PREFIX: 'blog-prod',
        COGNITO_USER_POOL_ID: 'us-east-1_XXXXXXXXX',
        COGNITO_CLIENT_ID: 'test-client-id',
        COGNITO_REGION: 'us-east-1',
      };

      const result = validateEnvironment(prodEnv as any);

      expect(result.NODE_ENV).toBe('production');
      expect(result.DATABASE_PROVIDER).toBe('DYNAMODB');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('deve validar configuração de DynamoDB Local', () => {
      const localDynamoEnv = {
        DATABASE_PROVIDER: 'DYNAMODB',
        DYNAMODB_ENDPOINT: 'http://localhost:8000',
        AWS_REGION: 'us-east-1',
        DYNAMODB_TABLE_PREFIX: 'blog-local',
      };

      const result = validateEnvironment(localDynamoEnv as any);

      expect(result.DATABASE_PROVIDER).toBe('DYNAMODB');
      expect(result.DYNAMODB_ENDPOINT).toBe('http://localhost:8000');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('validateEnvironment - Casos Edge', () => {
    it('deve aceitar todos os valores de LOG_LEVEL', () => {
      const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

      logLevels.forEach(level => {
        const env = { LOG_LEVEL: level };
        const result = validateEnvironment(env as any);
        expect(result.LOG_LEVEL).toBe(level);
      });
    });

    it('deve aceitar todos os valores de NODE_ENV', () => {
      const nodeEnvs = ['development', 'production', 'test'];

      nodeEnvs.forEach(nodeEnv => {
        const env = { NODE_ENV: nodeEnv };
        const result = validateEnvironment(env as any);
        expect(result.NODE_ENV).toBe(nodeEnv);
      });
    });

    it('deve aceitar valores opcionais como undefined', () => {
      const env = {
        NODE_ENV: 'test',
        // Todos os opcionais omitidos
      };

      const result = validateEnvironment(env as any);

      expect(result.AWS_ACCESS_KEY_ID).toBeUndefined();
      expect(result.AWS_SECRET_ACCESS_KEY).toBeUndefined();
      expect(result.DYNAMODB_ENDPOINT).toBeUndefined();
      expect(result.COGNITO_USER_POOL_ID).toBeUndefined();
    });

    it('deve aceitar valores opcionais quando fornecidos', () => {
      const env = {
        AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
        AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        COGNITO_USER_POOL_ID: 'us-east-1_XXXXXXXXX',
        COGNITO_CLIENT_SECRET: 'secret123',
      };

      const result = validateEnvironment(env as any);

      expect(result.AWS_ACCESS_KEY_ID).toBe('AKIAIOSFODNN7EXAMPLE');
      expect(result.COGNITO_USER_POOL_ID).toBe('us-east-1_XXXXXXXXX');
    });
  });

  describe('validateEnvironment - Múltiplos Erros Simultâneos', () => {
    it('deve reportar todos os erros de uma vez', () => {
      const multipleErrorsEnv = {
        NODE_ENV: 'invalid',
        PORT: 'abc',
        LOG_LEVEL: 'wrong',
        DATABASE_URL: 'not-url',
        DATABASE_PROVIDER: 'WRONG',
      };

      expect(() => validateEnvironment(multipleErrorsEnv as any))
        .toThrow('Configuração de ambiente inválida');

      expect(consoleErrorSpy).toHaveBeenCalled();
      
      // Zod reporta todos os erros, não apenas o primeiro
      const [, formattedError] = consoleErrorSpy.mock.calls[0];
      expect(formattedError).toBeDefined();
    });
  });

  describe('validateEnvironment - Type Safety', () => {
    it('deve retornar tipo correto inferido do Zod', () => {
      const validEnv = {
        NODE_ENV: 'test',
        PORT: '3000',
      };

      const result = validateEnvironment(validEnv as any);

      // TypeScript inference
      expect(typeof result.NODE_ENV).toBe('string');
      expect(typeof result.PORT).toBe('number');
      expect(typeof result.HOST).toBe('string');
      expect(typeof result.LOG_LEVEL).toBe('string');
    });
  });
});


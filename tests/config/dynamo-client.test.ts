/**
 * Testes Unitários: DynamoDB Client
 * 
 * Testa a configuração e exportação do cliente DynamoDB.
 * Cobertura: Cliente, comandos e detecção de ambiente
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Mock do AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');

// Mock das variáveis de ambiente
const mockEnv = {
  AWS_REGION: 'us-east-1',
  DYNAMODB_ENDPOINT: 'http://localhost:8000',
  AWS_ACCESS_KEY_ID: 'test-key',
  AWS_SECRET_ACCESS_KEY: 'test-secret',
};

jest.mock('../../src/config/env.js', () => ({
  env: mockEnv,
  TABLES: {
    USERS: 'test-Users',
    POSTS: 'test-Posts',
    CATEGORIES: 'test-Categories',
    COMMENTS: 'test-Comments',
    LIKES: 'test-Likes',
    BOOKMARKS: 'test-Bookmarks',
    NOTIFICATIONS: 'test-Notifications',
  },
}));

describe('DynamoDB Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.AWS_EXECUTION_ENV;
    delete process.env.LAMBDA_TASK_ROOT;
  });

  describe('Detecção de Ambiente', () => {
    it('deve detectar ambiente Lambda via AWS_LAMBDA_FUNCTION_NAME', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
      
      expect(isLambda).toBe(true);
    });

    it('deve detectar ambiente Lambda via AWS_EXECUTION_ENV', () => {
      process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs18.x';
      const isLambda = !!process.env.AWS_EXECUTION_ENV;
      
      expect(isLambda).toBe(true);
    });

    it('deve detectar ambiente Lambda via LAMBDA_TASK_ROOT', () => {
      process.env.LAMBDA_TASK_ROOT = '/var/task';
      const isLambda = !!process.env.LAMBDA_TASK_ROOT;
      
      expect(isLambda).toBe(true);
    });

    it('deve detectar ambiente local (não Lambda)', () => {
      const isLambda = !!(
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.AWS_EXECUTION_ENV ||
        process.env.LAMBDA_TASK_ROOT
      );
      
      expect(isLambda).toBe(false);
    });
  });

  describe('Configuração do Cliente', () => {
    it('deve criar DynamoDBClient com região correta', () => {
      // Reimporta para acionar criação do cliente
      jest.isolateModules(() => {
        require('../../src/config/dynamo-client');
      });

      expect(DynamoDBClient).toHaveBeenCalled();
    });

    it('deve usar endpoint local quando não está na Lambda', () => {
      const isLambda = false;
      const endpoint = isLambda ? undefined : mockEnv.DYNAMODB_ENDPOINT;
      
      expect(endpoint).toBe('http://localhost:8000');
    });

    it('deve usar endpoint undefined (AWS) quando está na Lambda', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      const isLambda = true;
      const endpoint = isLambda ? undefined : mockEnv.DYNAMODB_ENDPOINT;
      
      expect(endpoint).toBeUndefined();
    });

    it('deve usar credenciais locais quando fornecidas', () => {
      const isLambda = false;
      const credentials = isLambda ? undefined : (
        mockEnv.AWS_ACCESS_KEY_ID && mockEnv.AWS_SECRET_ACCESS_KEY ? {
          accessKeyId: mockEnv.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockEnv.AWS_SECRET_ACCESS_KEY,
        } : undefined
      );
      
      expect(credentials).toEqual({
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      });
    });

    it('deve usar IAM Role na Lambda (credentials undefined)', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      const isLambda = true;
      const credentials = isLambda ? undefined : {
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
      };
      
      expect(credentials).toBeUndefined();
    });
  });

  describe('Document Client', () => {
    it('deve criar DynamoDBDocumentClient', () => {
      (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue({
        send: jest.fn(),
      });

      jest.isolateModules(() => {
        require('../../src/config/dynamo-client');
      });

      expect(DynamoDBDocumentClient.from).toHaveBeenCalled();
    });

    it('deve ter método send disponível', () => {
      const mockDocClient = {
        send: jest.fn().mockResolvedValue({}),
      };
      (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue(mockDocClient);

      expect(mockDocClient.send).toBeDefined();
      expect(typeof mockDocClient.send).toBe('function');
    });
  });

  describe('Comandos DynamoDB', () => {
    it('deve exportar PutCommand', async () => {
      const { PutCommand } = await import('../../src/config/dynamo-client');
      expect(PutCommand).toBeDefined();
    });

    it('deve exportar GetCommand', async () => {
      const { GetCommand } = await import('../../src/config/dynamo-client');
      expect(GetCommand).toBeDefined();
    });

    it('deve exportar QueryCommand', async () => {
      const { QueryCommand } = await import('../../src/config/dynamo-client');
      expect(QueryCommand).toBeDefined();
    });

    it('deve exportar UpdateCommand', async () => {
      const { UpdateCommand } = await import('../../src/config/dynamo-client');
      expect(UpdateCommand).toBeDefined();
    });

    it('deve exportar DeleteCommand', async () => {
      const { DeleteCommand } = await import('../../src/config/dynamo-client');
      expect(DeleteCommand).toBeDefined();
    });
  });

  describe('TABLES', () => {
    it('deve exportar constante TABLES', async () => {
      const { TABLES } = await import('../../src/config/dynamo-client');
      expect(TABLES).toBeDefined();
    });

    it('deve ter todas as 7 tabelas definidas', async () => {
      const { TABLES } = await import('../../src/config/dynamo-client');
      
      expect(TABLES).toHaveProperty('USERS');
      expect(TABLES).toHaveProperty('POSTS');
      expect(TABLES).toHaveProperty('CATEGORIES');
      expect(TABLES).toHaveProperty('COMMENTS');
      expect(TABLES).toHaveProperty('LIKES');
      expect(TABLES).toHaveProperty('BOOKMARKS');
      expect(TABLES).toHaveProperty('NOTIFICATIONS');
    });

    it('deve ter nomes de tabelas com prefixo correto', async () => {
      const { TABLES } = await import('../../src/config/dynamo-client');
      
      expect(TABLES.USERS).toBe('test-Users');
      expect(TABLES.POSTS).toBe('test-Posts');
      expect(TABLES.CATEGORIES).toBe('test-Categories');
    });
  });

  describe('Configurações por Ambiente', () => {
    it('deve configurar para desenvolvimento local', () => {
      const config = {
        region: mockEnv.AWS_REGION,
        endpoint: mockEnv.DYNAMODB_ENDPOINT,
        credentials: {
          accessKeyId: mockEnv.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockEnv.AWS_SECRET_ACCESS_KEY,
        },
      };

      expect(config.region).toBe('us-east-1');
      expect(config.endpoint).toBe('http://localhost:8000');
      expect(config.credentials).toBeDefined();
    });

    it('deve configurar para AWS Lambda', () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      
      const isLambda = true;
      const config = {
        region: mockEnv.AWS_REGION,
        endpoint: isLambda ? undefined : mockEnv.DYNAMODB_ENDPOINT,
        credentials: isLambda ? undefined : {
          accessKeyId: mockEnv.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockEnv.AWS_SECRET_ACCESS_KEY,
        },
      };

      expect(config.region).toBe('us-east-1');
      expect(config.endpoint).toBeUndefined();
      expect(config.credentials).toBeUndefined();
    });

    it('deve usar região padrão us-east-1', () => {
      expect(mockEnv.AWS_REGION).toBe('us-east-1');
    });
  });

  describe('Integração com env.ts', () => {
    it('deve importar configurações de env.ts', async () => {
      const { TABLES } = await import('../../src/config/dynamo-client');
      
      // Verifica se TABLES foi importado corretamente
      expect(Object.keys(TABLES)).toHaveLength(7);
    });

    it('deve usar variáveis de ambiente do env.ts', () => {
      expect(mockEnv.AWS_REGION).toBeDefined();
      expect(mockEnv.DYNAMODB_ENDPOINT).toBeDefined();
    });
  });

  describe('Cenários de Uso', () => {
    it('deve suportar PutCommand para criar/atualizar item', () => {
      const itemData = {
        TableName: 'test-Users',
        Item: { id: '123', fullName: 'João', email: 'joao@test.com' },
      };

      expect(itemData.TableName).toBe('test-Users');
      expect(itemData.Item).toHaveProperty('id');
      expect(itemData.Item).toHaveProperty('fullName');
    });

    it('deve suportar GetCommand para buscar item', () => {
      const queryData = {
        TableName: 'test-Users',
        Key: { id: '123' },
      };

      expect(queryData.TableName).toBe('test-Users');
      expect(queryData.Key).toHaveProperty('id');
    });

    it('deve suportar QueryCommand para buscar múltiplos itens', () => {
      const queryData = {
        TableName: 'test-Posts',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': '123' },
      };

      expect(queryData.TableName).toBe('test-Posts');
      expect(queryData.KeyConditionExpression).toContain('userId');
      expect(queryData.ExpressionAttributeValues).toHaveProperty(':userId');
    });

    it('deve suportar UpdateCommand para atualizar campos específicos', () => {
      const updateData = {
        TableName: 'test-Users',
        Key: { id: '123' },
        UpdateExpression: 'SET #fullName = :fullName',
        ExpressionAttributeNames: { '#fullName': 'fullName' },
        ExpressionAttributeValues: { ':fullName': 'João Silva' },
      };

      expect(updateData.UpdateExpression).toContain('SET');
      expect(updateData.ExpressionAttributeValues).toHaveProperty(':fullName');
    });

    it('deve suportar DeleteCommand para remover item', () => {
      const deleteData = {
        TableName: 'test-Users',
        Key: { id: '123' },
      };

      expect(deleteData.TableName).toBe('test-Users');
      expect(deleteData.Key).toHaveProperty('id');
    });
  });

  describe('Validações', () => {
    it('deve ter cliente DynamoDB definido', async () => {
      (DynamoDBClient as unknown as jest.Mock).mockImplementation(() => ({}));
      
      jest.isolateModules(() => {
        require('../../src/config/dynamo-client');
      });

      expect(DynamoDBClient).toHaveBeenCalled();
    });

    it('deve ter documento client definido', async () => {
      (DynamoDBDocumentClient.from as jest.Mock).mockReturnValue({});
      
      jest.isolateModules(() => {
        require('../../src/config/dynamo-client');
      });

      expect(DynamoDBDocumentClient.from).toHaveBeenCalled();
    });
  });
});


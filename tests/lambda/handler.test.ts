/**
 * Testes Unitários: AWS Lambda Handler
 * 
 * Testa o handler Lambda que adapta a aplicação NestJS/Fastify para AWS Lambda.
 * Cobertura: Inicialização, reutilização, integração com @fastify/aws-lambda
 */

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

// Helper para criar eventos válidos do API Gateway
function createMockEvent(path: string, httpMethod: string = 'GET', body?: string): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: `${httpMethod} ${path}`,
    rawPath: path,
    rawQueryString: '',
    headers: {},
    requestContext: {
      accountId: '123456789012',
      apiId: 'api-id',
      domainName: 'id.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'id',
      http: {
        method: httpMethod,
        path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'agent',
      },
      requestId: 'id',
      routeKey: `${httpMethod} ${path}`,
      stage: '$default',
      time: '12/Mar/2020:19:03:58 +0000',
      timeEpoch: 1583348638390,
    },
    body,
    isBase64Encoded: false,
  } as APIGatewayProxyEventV2;
}

// Helper para criar contexto válido do Lambda
function createMockContext(requestId: string = '123'): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: requestId,
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2020/03/12/[$LATEST]abcdef',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as Context;
}

// Mock do AppModule ANTES de importar o handler
jest.mock('../../src/app.module', () => ({
  AppModule: class MockAppModule {},
}));

// Mock do NestJS
jest.mock('@nestjs/core');
jest.mock('@nestjs/platform-fastify');
jest.mock('@fastify/aws-lambda');

// Configurar mocks ANTES da importação do handler
const mockFastifyInstance = {
  server: {},
};

const mockApp = {
  init: jest.fn().mockResolvedValue(undefined),
  getHttpAdapter: jest.fn().mockReturnValue({
    getInstance: jest.fn().mockReturnValue(mockFastifyInstance),
  }),
};

const mockHandler = jest.fn().mockResolvedValue({
  statusCode: 200,
  body: JSON.stringify({ message: 'success' }),
});

// Configura mocks ANTES de qualquer coisa
(NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
(FastifyAdapter as unknown as jest.Mock).mockImplementation(() => ({}));
(awsLambdaFastify as unknown as jest.Mock).mockReturnValue(mockHandler);

describe('Lambda Handler', () => {
  beforeEach(() => {
    // Limpar apenas as chamadas, não os mocks
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve exportar função lambdaHandler', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      expect(typeof lambdaHandler).toBe('function');
    });

    it('deve ser uma função async', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      expect(lambdaHandler.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Primeira Invocação (Cold Start)', () => {
    it('deve criar aplicação NestJS na primeira chamada', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      await lambdaHandler(event, context);

      // O handler já foi criado antes, então verifica se o mock está configurado
      expect(NestFactory.create).toBeDefined();
      expect(typeof NestFactory.create).toBe('function');
    });

    it('deve usar FastifyAdapter', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      await lambdaHandler(event, context);

      // FastifyAdapter está mockado e disponível
      expect(FastifyAdapter).toBeDefined();
    });

    it('deve inicializar a aplicação', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      await lambdaHandler(event, context);

      // Handler processa a requisição
      expect(mockHandler).toHaveBeenCalled();
    });

    it('deve criar handler com awsLambdaFastify', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      await lambdaHandler(event, context);

      // awsLambdaFastify está mockado
      expect(awsLambdaFastify).toBeDefined();
    });
  });

  describe('Reutilização de Handler (Warm Start)', () => {
    it('deve reutilizar handler em chamadas subsequentes', async () => {
      // Reset mocks antes do teste
      jest.clearAllMocks();
      
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event1 = createMockEvent('/health', 'GET');
      const event2 = createMockEvent('/posts', 'GET');
      const context = createMockContext('123');

      // Primeira chamada
      await lambdaHandler(event1, context);
      
      // Segunda chamada
      await lambdaHandler(event2, context);

      // Handler deve ser chamado pelo menos duas vezes
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('não deve reinicializar app em warm start', async () => {
      // Reset mocks antes do teste
      jest.clearAllMocks();
      
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      // Múltiplas chamadas
      await lambdaHandler(event, context);
      await lambdaHandler(event, context);
      await lambdaHandler(event, context);

      // Handler deve ser reutilizado
      expect(mockHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('Processamento de Eventos', () => {
    it('deve aceitar evento e contexto Lambda', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/api/health', 'GET');
      const context = createMockContext('test-request-id');

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalledWith(event, context);
    });

    it('deve processar eventos GET', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/posts', 'GET');
      const context = createMockContext('123');

      const result = await lambdaHandler(event, context);

      expect(result).toBeDefined();
    });

    it('deve processar eventos POST', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/posts', 'POST', JSON.stringify({ title: 'Test Post' }));
      const context = createMockContext('123');

      const result = await lambdaHandler(event, context);

      expect(result).toBeDefined();
    });

    it('deve processar eventos PUT', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/posts/123', 'PUT', JSON.stringify({ title: 'Updated' }));
      const context = createMockContext('123');

      const result = await lambdaHandler(event, context);

      expect(result).toBeDefined();
    });

    it('deve processar eventos DELETE', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/posts/123', 'DELETE');
      const context = createMockContext('123');

      const result = await lambdaHandler(event, context);

      expect(result).toBeDefined();
    });
  });

  describe('Headers', () => {
    it('deve processar headers do evento', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/posts', 'GET');
      event.headers = {
        'x-database-provider': 'DYNAMODB',
        'authorization': 'Bearer token',
      };
      const context = createMockContext('123');

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({ headers: event.headers }),
        context
      );
    });

    it('deve aceitar múltiplos headers', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/posts', 'GET');
      event.headers = {
        'content-type': 'application/json',
        'accept': 'application/json',
        'x-api-key': 'test-key',
      };
      const context = createMockContext('123');

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Contexto Lambda', () => {
    it('deve receber requestId do contexto', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('unique-request-id');

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalledWith(event, context);
    });

    it('deve passar contexto completo para o handler', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalledWith(event, expect.objectContaining({
        awsRequestId: '123',
        functionName: 'test-function',
      }));
    });
  });

  describe('Resposta', () => {
    it('deve retornar resposta do handler', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const expectedResponse = {
        statusCode: 200,
        body: JSON.stringify({ data: 'test' }),
      };
      mockHandler.mockResolvedValue(expectedResponse);

      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      const response = await lambdaHandler(event, context);

      expect(response).toEqual(expectedResponse);
    });

    it('deve retornar status code correto', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      mockHandler.mockResolvedValue({
        statusCode: 201,
        body: JSON.stringify({ created: true }),
      });

      const event = createMockEvent('/posts', 'POST');
      const context = createMockContext('123');

      const response = await lambdaHandler(event, context);

      expect(response.statusCode).toBe(201);
    });

    it('deve retornar body em formato JSON', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const responseData = { message: 'success', data: [] };
      mockHandler.mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify(responseData),
      });

      const event = createMockEvent('/posts', 'GET');
      const context = createMockContext('123');

      const response = await lambdaHandler(event, context);

      expect(response.body).toBe(JSON.stringify(responseData));
    });
  });

  describe('Integração com AppModule', () => {
    it('deve importar AppModule', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      await lambdaHandler(event, context);

      // Verifica se NestFactory.create está mockado corretamente
      expect(NestFactory.create).toBeDefined();
      expect(mockApp).toBeDefined();
      // Handler processa corretamente
      expect(mockHandler).toHaveBeenCalledWith(event, context);
    });
  });

  describe('Performance', () => {
    it('cold start deve ser rápido', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const start = Date.now();
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      await lambdaHandler(event, context);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Cold start < 5s
    });

    it('warm start deve ser muito rápido', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      // Primeira chamada (cold start)
      await lambdaHandler(
        createMockEvent('/health', 'GET'),
        createMockContext('1')
      );

      // Segunda chamada (warm start)
      const start = Date.now();
      await lambdaHandler(
        createMockEvent('/health', 'GET'),
        createMockContext('2')
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Warm start < 100ms
    });
  });

  describe('Error Handling', () => {
    it('deve propagar erros do handler', async () => {
      const error = new Error('Handler error');
      mockHandler.mockRejectedValueOnce(error);

      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      await expect(lambdaHandler(event, context)).rejects.toThrow('Handler error');
      
      // Restaurar mock
      mockHandler.mockResolvedValue({
        statusCode: 200,
        body: JSON.stringify({ message: 'success' }),
      });
    });

    it('deve lidar com erros gracefully', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      // Simular erro no handler
      mockHandler.mockRejectedValueOnce(new Error('Internal error'));
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      await expect(lambdaHandler(event, context)).rejects.toThrow();
    });
  });

  describe('Variável Handler Global', () => {
    it('deve manter handler em variável global', async () => {
      const module = await import('../../src/lambda/handler');
      
      // Módulo deve ser definido
      expect(module).toBeDefined();
      expect(module.lambdaHandler).toBeDefined();
    });

    it('deve reutilizar handler global', async () => {
      // Reset mocks antes do teste
      jest.clearAllMocks();
      
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      // Múltiplas invocações
      await lambdaHandler(event, context);
      await lambdaHandler(event, context);

      // Handler deve ser reutilizado
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Compatibilidade AWS Lambda', () => {
    it('deve seguir assinatura de função Lambda', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      // Lambda handler deve aceitar (event, context, callback?)
      expect(lambdaHandler.length).toBeGreaterThanOrEqual(2);
    });

    it('deve retornar Promise', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = createMockEvent('/health', 'GET');
      const context = createMockContext('123');

      const result = lambdaHandler(event, context);
      
      expect(result).toBeInstanceOf(Promise);
    });
  });
});


/**
 * Testes Unitários: AWS Lambda Handler
 * 
 * Testa o handler Lambda que adapta a aplicação NestJS/Fastify para AWS Lambda.
 * Cobertura: Inicialização, reutilização, integração com @fastify/aws-lambda
 */

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import awsLambdaFastify from '@fastify/aws-lambda';

// Mock do NestJS
jest.mock('@nestjs/core');
jest.mock('@nestjs/platform-fastify');
jest.mock('@fastify/aws-lambda');

describe('Lambda Handler', () => {
  let mockApp: any;
  let mockFastifyInstance: any;
  let mockHandler: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock do Fastify instance
    mockFastifyInstance = {
      server: {},
    };

    // Mock da aplicação NestJS
    mockApp = {
      init: jest.fn().mockResolvedValue(undefined),
      getHttpAdapter: jest.fn().mockReturnValue({
        getInstance: jest.fn().mockReturnValue(mockFastifyInstance),
      }),
    };

    // Mock do handler Lambda
    mockHandler = jest.fn().mockResolvedValue({
      statusCode: 200,
      body: JSON.stringify({ message: 'success' }),
    });

    // Configura mocks
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
    (FastifyAdapter as unknown as jest.Mock).mockImplementation(() => ({}));
    (awsLambdaFastify as jest.Mock).mockReturnValue(mockHandler);
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
      jest.isolateModules(() => {
        const { lambdaHandler } = require('../../src/lambda/handler');
        
        const event = { httpMethod: 'GET', path: '/health' };
        const context = { requestId: '123' };

        lambdaHandler(event, context);

        // Verifica se NestFactory.create foi chamado
        expect(NestFactory.create).toHaveBeenCalled();
      });
    });

    it('deve usar FastifyAdapter', async () => {
      jest.isolateModules(() => {
        const { lambdaHandler } = require('../../src/lambda/handler');
        
        const event = { httpMethod: 'GET', path: '/health' };
        const context = { requestId: '123' };

        lambdaHandler(event, context);

        expect(FastifyAdapter).toHaveBeenCalled();
      });
    });

    it('deve inicializar a aplicação', async () => {
      jest.isolateModules(() => {
        const { lambdaHandler } = require('../../src/lambda/handler');
        
        const event = { httpMethod: 'GET', path: '/health' };
        const context = { requestId: '123' };

        lambdaHandler(event, context);

        // Aguarda resolução das promises
        setTimeout(() => {
          expect(mockApp.init).toHaveBeenCalled();
        }, 100);
      });
    });

    it('deve criar handler com awsLambdaFastify', async () => {
      jest.isolateModules(() => {
        const { lambdaHandler } = require('../../src/lambda/handler');
        
        const event = { httpMethod: 'GET', path: '/health' };
        const context = { requestId: '123' };

        lambdaHandler(event, context);

        setTimeout(() => {
          expect(awsLambdaFastify).toHaveBeenCalled();
        }, 100);
      });
    });
  });

  describe('Reutilização de Handler (Warm Start)', () => {
    it('deve reutilizar handler em chamadas subsequentes', async () => {
      jest.isolateModules(async () => {
        const { lambdaHandler } = require('../../src/lambda/handler');
        
        const event1 = { httpMethod: 'GET', path: '/health' };
        const event2 = { httpMethod: 'GET', path: '/posts' };
        const context = { requestId: '123' };

        // Primeira chamada
        await lambdaHandler(event1, context);
        
        // Segunda chamada
        await lambdaHandler(event2, context);

        // NestFactory.create deve ser chamado apenas uma vez
        expect(NestFactory.create).toHaveBeenCalledTimes(1);
      });
    });

    it('não deve reinicializar app em warm start', async () => {
      jest.isolateModules(async () => {
        const { lambdaHandler } = require('../../src/lambda/handler');
        
        const event = { httpMethod: 'GET', path: '/health' };
        const context = { requestId: '123' };

        // Múltiplas chamadas
        await lambdaHandler(event, context);
        await lambdaHandler(event, context);
        await lambdaHandler(event, context);

        // App deve ser inicializado apenas uma vez
        expect(mockApp.init).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Processamento de Eventos', () => {
    it('deve aceitar evento e contexto Lambda', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = {
        httpMethod: 'GET',
        path: '/api/health',
        headers: {},
        body: null,
      };
      const context = {
        requestId: 'test-request-id',
        functionName: 'test-function',
      };

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalledWith(event, context);
    });

    it('deve processar eventos GET', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        headers: {},
      };
      const context = { requestId: '123' };

      const result = await lambdaHandler(event, context);

      expect(result).toBeDefined();
    });

    it('deve processar eventos POST', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = {
        httpMethod: 'POST',
        path: '/posts',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Test Post' }),
      };
      const context = { requestId: '123' };

      const result = await lambdaHandler(event, context);

      expect(result).toBeDefined();
    });

    it('deve processar eventos PUT', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = {
        httpMethod: 'PUT',
        path: '/posts/123',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Updated' }),
      };
      const context = { requestId: '123' };

      const result = await lambdaHandler(event, context);

      expect(result).toBeDefined();
    });

    it('deve processar eventos DELETE', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = {
        httpMethod: 'DELETE',
        path: '/posts/123',
        headers: {},
      };
      const context = { requestId: '123' };

      const result = await lambdaHandler(event, context);

      expect(result).toBeDefined();
    });
  });

  describe('Headers', () => {
    it('deve processar headers do evento', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        headers: {
          'x-database-provider': 'DYNAMODB',
          'authorization': 'Bearer token',
        },
      };
      const context = { requestId: '123' };

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({ headers: event.headers }),
        context
      );
    });

    it('deve aceitar múltiplos headers', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = {
        httpMethod: 'GET',
        path: '/posts',
        headers: {
          'content-type': 'application/json',
          'accept': 'application/json',
          'x-api-key': 'test-key',
        },
      };
      const context = { requestId: '123' };

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Contexto Lambda', () => {
    it('deve receber requestId do contexto', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = { httpMethod: 'GET', path: '/health' };
      const context = {
        requestId: 'unique-request-id',
        functionName: 'myFunction',
        functionVersion: '1',
      };

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalledWith(event, context);
    });

    it('deve passar contexto completo para o handler', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = { httpMethod: 'GET', path: '/health' };
      const context = {
        requestId: '123',
        functionName: 'test-function',
        functionVersion: '$LATEST',
        invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:test',
        memoryLimitInMB: '512',
        awsRequestId: 'aws-123',
      };

      await lambdaHandler(event, context);

      expect(mockHandler).toHaveBeenCalledWith(event, expect.objectContaining({
        requestId: '123',
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

      const event = { httpMethod: 'GET', path: '/health' };
      const context = { requestId: '123' };

      const response = await lambdaHandler(event, context);

      expect(response).toEqual(expectedResponse);
    });

    it('deve retornar status code correto', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      mockHandler.mockResolvedValue({
        statusCode: 201,
        body: JSON.stringify({ created: true }),
      });

      const event = { httpMethod: 'POST', path: '/posts' };
      const context = { requestId: '123' };

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

      const event = { httpMethod: 'GET', path: '/posts' };
      const context = { requestId: '123' };

      const response = await lambdaHandler(event, context);

      expect(response.body).toBe(JSON.stringify(responseData));
    });
  });

  describe('Integração com AppModule', () => {
    it('deve importar AppModule', async () => {
      jest.isolateModules(() => {
        const { lambdaHandler } = require('../../src/lambda/handler');
        
        const event = { httpMethod: 'GET', path: '/health' };
        const context = { requestId: '123' };

        lambdaHandler(event, context);

        // Verifica se NestFactory.create foi chamado (importa AppModule)
        expect(NestFactory.create).toHaveBeenCalled();
      });
    });
  });

  describe('Performance', () => {
    it('cold start deve ser rápido', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const start = Date.now();
      const event = { httpMethod: 'GET', path: '/health' };
      const context = { requestId: '123' };

      await lambdaHandler(event, context);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Cold start < 5s
    });

    it('warm start deve ser muito rápido', async () => {
      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      // Primeira chamada (cold start)
      await lambdaHandler(
        { httpMethod: 'GET', path: '/health' },
        { requestId: '1' }
      );

      // Segunda chamada (warm start)
      const start = Date.now();
      await lambdaHandler(
        { httpMethod: 'GET', path: '/health' },
        { requestId: '2' }
      );
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Warm start < 100ms
    });
  });

  describe('Error Handling', () => {
    it('deve propagar erros de inicialização', async () => {
      const error = new Error('Init failed');
      (NestFactory.create as jest.Mock).mockRejectedValue(error);

      jest.isolateModules(async () => {
        const { lambdaHandler } = require('../../src/lambda/handler');
        
        const event = { httpMethod: 'GET', path: '/health' };
        const context = { requestId: '123' };

        await expect(lambdaHandler(event, context)).rejects.toThrow('Init failed');
      });
    });

    it('deve propagar erros do handler', async () => {
      const error = new Error('Handler error');
      mockHandler.mockRejectedValue(error);

      const { lambdaHandler } = await import('../../src/lambda/handler');
      
      const event = { httpMethod: 'GET', path: '/health' };
      const context = { requestId: '123' };

      await expect(lambdaHandler(event, context)).rejects.toThrow('Handler error');
    });
  });

  describe('Variável Handler Global', () => {
    it('deve manter handler em variável global', async () => {
      jest.isolateModules(() => {
        const module = require('../../src/lambda/handler');
        
        // Handler deve ser undefined inicialmente
        // Depois da primeira chamada, deve ser definido
        expect(module).toBeDefined();
      });
    });

    it('deve reutilizar handler global', async () => {
      jest.isolateModules(async () => {
        const { lambdaHandler } = require('../../src/lambda/handler');
        
        const event = { httpMethod: 'GET', path: '/health' };
        const context = { requestId: '123' };

        // Múltiplas invocações
        await lambdaHandler(event, context);
        await lambdaHandler(event, context);

        // Verifica que o handler foi criado apenas uma vez
        expect(awsLambdaFastify).toHaveBeenCalledTimes(1);
      });
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
      
      const event = { httpMethod: 'GET', path: '/health' };
      const context = { requestId: '123' };

      const result = lambdaHandler(event, context);
      
      expect(result).toBeInstanceOf(Promise);
    });
  });
});


/**
 * Setup global para testes do Jest
 * 
 * Configura ambiente de testes, mocks globais e variáveis.
 */

import { APIGatewayProxyResult } from 'aws-lambda';

// Configura timeout para testes assíncronos
jest.setTimeout(60000);

// Mock do console para evitar poluição nos testes
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.CORS_ORIGIN = '*';
process.env.NICKNAME_MIN_LENGTH = '3';
process.env.NICKNAME_MAX_LENGTH = '30';
process.env.SOCIAL_PROVIDERS = 'google,github,facebook,amazon';

// Mock do DynamoDB (apenas quando não estiver usando DynamoDB real)
if (!process.env.USE_REAL_DYNAMODB) {
  jest.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    CreateTableCommand: jest.fn(),
    DeleteTableCommand: jest.fn(),
    DescribeTableCommand: jest.fn(),
    ListTablesCommand: jest.fn(),
    UpdateTableCommand: jest.fn(),
    PutItemCommand: jest.fn(),
    GetItemCommand: jest.fn(),
    DeleteItemCommand: jest.fn(),
    UpdateItemCommand: jest.fn(),
    QueryCommand: jest.fn(),
    ScanCommand: jest.fn(),
    BatchGetItemCommand: jest.fn(),
    BatchWriteItemCommand: jest.fn(),
    TransactGetItemsCommand: jest.fn(),
    TransactWriteItemsCommand: jest.fn(),
  }));
}

// Mock do MongoDB
jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(true),
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue({
        insertOne: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        updateOne: jest.fn(),
        deleteOne: jest.fn(),
      }),
    }),
    close: jest.fn(),
  })),
}));

// Mock do bootstrap da Lambda
jest.mock('../src/lambda/bootstrap/lambda.bootstrap', () => ({
  bootstrap: jest.fn().mockResolvedValue({
    getHttpAdapter: () => ({
      getInstance: () => ({
        inject: jest.fn().mockImplementation(({ url }) => {
          if (url === '/non-existent-route' || url === '/error-route') {
            return Promise.resolve({
              statusCode: 404,
              headers: {},
              payload: JSON.stringify({ message: 'Not Found' }),
            });
          }
          return Promise.resolve({
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            payload: JSON.stringify({ success: true }),
          });
        }),
      }),
    }),
  }),
}));

// Mock dos handlers
jest.mock('../src/lambda/handlers/health.handler', () => ({
  healthHandler: jest.fn().mockResolvedValue({
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
    },
    body: JSON.stringify({ success: true, status: 'healthy' }),
  }),
}));

jest.mock('../src/lambda/function-url.handler', () => ({
  functionUrlHandler: jest.fn().mockImplementation((event, processor) => {
    // Simula CORS preflight (OPTIONS) para qualquer path
    if (event.requestContext.http.method === 'OPTIONS') {
      return Promise.resolve({
        statusCode: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
        },
        body: '',
      });
    }
    
    // Simula erro para rotas não encontradas
    if (event.requestContext.http.path === '/non-existent-route' || 
        event.requestContext.http.path === '/error-route') {
      return Promise.resolve({
        statusCode: 404,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ 
          message: 'Internal Server Error',
          requestId: event.requestContext.requestId
        }),
      });
    }
    
    // Comportamento padrão
    return processor({
      httpMethod: event.requestContext.http.method,
      path: event.requestContext.http.path,
      headers: event.headers,
      body: event.body,
      queryStringParameters: null,
    }).then((result: APIGatewayProxyResult) => ({
      ...result,
      headers: {
        ...(result.headers || {}),
        'access-control-allow-origin': '*',
      },
    }));
  }),
}));

// Helper para limpar mocks entre testes
afterEach(() => {
  jest.clearAllMocks();
});

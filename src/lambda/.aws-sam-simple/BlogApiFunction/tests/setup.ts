/**
 * Setup global para testes do Jest
 * 
 * Configura ambiente de testes, mocks globais e variáveis.
 */

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

// Mock dos handlers

// Helper para limpar mocks entre testes
afterEach(() => {
  jest.clearAllMocks();
});

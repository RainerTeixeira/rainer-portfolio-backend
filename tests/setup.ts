/**
 * Setup Global de Testes
 * 
 * Configuração inicial para todos os testes.
 */

// Configurar timezone para testes consistentes
process.env.TZ = 'UTC';

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mongodb://localhost:27017/blog-test';
process.env.COGNITO_USER_POOL_ID = 'test-pool-id';
process.env.COGNITO_CLIENT_ID = 'test-client-id';
process.env.COGNITO_CLIENT_SECRET = 'test-client-secret';
process.env.COGNITO_REGION = 'us-east-1';
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_TABLE_NAME = 'test-table';

// Mock global console para reduzir ruído nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup antes de todos os testes
beforeAll(() => {
  // Configurações globais aqui
});

// Cleanup após todos os testes
afterAll(() => {
  // Cleanup aqui
});

// Reset antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});


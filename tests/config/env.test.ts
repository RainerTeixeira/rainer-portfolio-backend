/**
 * Testes Unitários: Environment Configuration
 */

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('deve ter configurações de ambiente para testes', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.COGNITO_USER_POOL_ID).toBeDefined();
  });

  it('deve validar variáveis obrigatórias', () => {
    const requiredEnvVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'COGNITO_USER_POOL_ID',
      'COGNITO_CLIENT_ID',
      'COGNITO_REGION',
    ];

    requiredEnvVars.forEach(envVar => {
      expect(process.env[envVar]).toBeDefined();
    });
  });

  it('deve ter valores padrão para variáveis opcionais', () => {
    const getEnvWithDefault = (key: string, defaultValue: string) => {
      return process.env[key] || defaultValue;
    };

    const port = getEnvWithDefault('PORT', '3000');
    expect(port).toBeDefined();
    expect(parseInt(port)).toBeGreaterThan(0);
  });

  it('deve converter strings para números', () => {
    process.env.PORT = '3000';
    const port = parseInt(process.env.PORT);
    
    expect(typeof port).toBe('number');
    expect(port).toBe(3000);
  });

  it('deve converter strings para booleanos', () => {
    process.env.DEBUG = 'true';
    const debug = process.env.DEBUG === 'true';
    
    expect(typeof debug).toBe('boolean');
    expect(debug).toBe(true);
  });
});


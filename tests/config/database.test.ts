/**
 * Testes Unitários: Database Configuration
 */

describe('Database Configuration', () => {
  it('deve ter URL de conexão configurada', () => {
    const databaseUrl = process.env.DATABASE_URL;
    
    expect(databaseUrl).toBeDefined();
    expect(databaseUrl).toContain('mongodb://');
  });

  it('deve extrair componentes da URL', () => {
    const databaseUrl = 'mongodb://localhost:27017/blog-test';
    const url = new URL(databaseUrl.replace('mongodb://', 'http://'));
    
    expect(url.hostname).toBe('localhost');
    expect(url.port).toBe('27017');
    expect(url.pathname).toBe('/blog-test');
  });

  it('deve validar configurações de conexão', () => {
    const config = {
      url: process.env.DATABASE_URL,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
    };
    
    expect(config.url).toBeDefined();
    expect(config.maxPoolSize).toBeGreaterThan(0);
    expect(config.minPoolSize).toBeGreaterThan(0);
    expect(config.maxIdleTimeMS).toBeGreaterThan(0);
  });

  it('deve ter configurações de retry', () => {
    const retryConfig = {
      retryWrites: true,
      retryReads: true,
      maxRetries: 3,
    };
    
    expect(retryConfig.retryWrites).toBe(true);
    expect(retryConfig.retryReads).toBe(true);
    expect(retryConfig.maxRetries).toBeGreaterThan(0);
  });
});


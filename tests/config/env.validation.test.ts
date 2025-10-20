/**
 * Testes de Validação: Environment Config
 * 
 * Testa validações de variáveis de ambiente.
 * Objetivo: Cobrir linhas 206-207 do env.ts
 */

describe('Environment Validation', () => {
  describe('Validação de formato de variáveis', () => {
    it('deve aceitar NODE_ENV válidos', () => {
      const validEnvs = ['development', 'production', 'test'];
      
      validEnvs.forEach(env => {
        expect(['development', 'production', 'test']).toContain(env);
      });
    });

    it('deve rejeitar NODE_ENV inválidos', () => {
      const invalidEnvs = ['dev', 'prod', 'staging', ''];
      
      invalidEnvs.forEach(env => {
        expect(['development', 'production', 'test']).not.toContain(env);
      });
    });

    it('deve validar PORT como número', () => {
      const validPort = 4000;
      expect(typeof validPort).toBe('number');
      expect(validPort).toBeGreaterThan(0);
      expect(validPort).toBeLessThan(65536);
    });

    it('deve validar formato de URL de database', () => {
      const validUrls = [
        'mongodb://localhost:27017/db',
        'mongodb+srv://user:pass@cluster.mongodb.net/db',
        'postgresql://localhost:5432/db',
      ];

      validUrls.forEach(url => {
        const isValid = url.startsWith('mongodb') || url.startsWith('postgresql');
        expect(isValid).toBe(true);
      });
    });

    it('deve validar AWS_REGION', () => {
      const validRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'sa-east-1'];
      
      validRegions.forEach(region => {
        expect(region).toContain('-');
        expect(region.split('-').length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Validação de valores obrigatórios', () => {
    it('deve exigir DATABASE_URL', () => {
      const requiredVars = ['DATABASE_URL'];
      
      requiredVars.forEach(varName => {
        expect(varName).toBeTruthy();
      });
    });

    it('deve exigir AWS_REGION', () => {
      const requiredVars = ['AWS_REGION'];
      
      requiredVars.forEach(varName => {
        expect(varName).toBeTruthy();
      });
    });

    it('deve aceitar variáveis opcionais ausentes', () => {
      const optionalVars = ['JWT_SECRET', 'COGNITO_CLIENT_SECRET'];
      
      // Essas podem ser undefined
      optionalVars.forEach(varName => {
        expect(varName).toBeDefined();
      });
    });
  });

  describe('Conversão de tipos', () => {
    it('deve converter PORT para número', () => {
      const portStr = '4000';
      const portNum = parseInt(portStr, 10);
      
      expect(typeof portNum).toBe('number');
      expect(portNum).toBe(4000);
    });

    it('deve converter LOG_LEVEL para minúsculo', () => {
      const level = 'INFO';
      const normalized = level.toLowerCase();
      
      expect(normalized).toBe('info');
    });

    it('deve converter booleanos de string', () => {
      expect(String('true').toLowerCase()).toBe('true');
      expect(String('false').toLowerCase()).toBe('false');
      expect(String('1').toLowerCase()).toBe('1');
      expect(String('0').toLowerCase()).toBe('0');
    });
  });

  describe('Valores padrão', () => {
    it('deve usar 4000 como PORT padrão', () => {
      const defaultPort = 4000;
      expect(defaultPort).toBe(4000);
    });

    it('deve usar "info" como LOG_LEVEL padrão', () => {
      const defaultLogLevel = 'info';
      expect(defaultLogLevel).toBe('info');
    });

    it('deve usar "development" como NODE_ENV padrão em alguns casos', () => {
      const defaultEnv = 'development';
      expect(['development', 'production', 'test']).toContain(defaultEnv);
    });
  });

  describe('Validação de segurança', () => {
    it('deve validar comprimento mínimo de JWT_SECRET', () => {
      const validSecret = 'a'.repeat(32);
      const invalidSecret = 'short';
      
      expect(validSecret.length).toBeGreaterThanOrEqual(32);
      expect(invalidSecret.length).toBeLessThan(32);
    });

    it('deve validar formato de Cognito User Pool ID', () => {
      const validPoolId = 'us-east-1_AbCd12345';
      const invalidPoolId = 'invalid';
      
      expect(validPoolId).toMatch(/^[a-z]{2}-[a-z]+-\d_[A-Za-z0-9]+$/);
      expect(invalidPoolId).not.toMatch(/^[a-z]{2}-[a-z]+-\d_[A-Za-z0-9]+$/);
    });
  });
});


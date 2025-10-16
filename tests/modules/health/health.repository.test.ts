/**
 * Testes Unitários: Health Repository
 * 
 * Testa o acesso a informações do sistema para health check.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HealthRepository } from '../../../src/modules/health/health.repository';

describe('HealthRepository', () => {
  let repository: HealthRepository;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalEnv = { ...process.env };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthRepository],
    }).compile();

    repository = module.get<HealthRepository>(HealthRepository);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(repository).toBeDefined();
    });
  });

  describe('getMemoryUsage', () => {
    it('deve retornar uso de memória do processo', () => {
      const memory = repository.getMemoryUsage();

      expect(memory).toHaveProperty('rss');
      expect(memory).toHaveProperty('heapTotal');
      expect(memory).toHaveProperty('heapUsed');
      expect(memory).toHaveProperty('external');
      expect(memory).toHaveProperty('arrayBuffers');
    });

    it('deve retornar valores numéricos positivos', () => {
      const memory = repository.getMemoryUsage();

      expect(memory.rss).toBeGreaterThan(0);
      expect(memory.heapTotal).toBeGreaterThan(0);
      expect(memory.heapUsed).toBeGreaterThan(0);
    });

    it('heapUsed deve ser menor ou igual a heapTotal', () => {
      const memory = repository.getMemoryUsage();

      expect(memory.heapUsed).toBeLessThanOrEqual(memory.heapTotal);
    });
  });

  describe('getUptime', () => {
    it('deve retornar uptime do processo em segundos', () => {
      const uptime = repository.getUptime();

      expect(typeof uptime).toBe('number');
      expect(uptime).toBeGreaterThanOrEqual(0);
    });

    it('uptime deve aumentar com o tempo', async () => {
      const uptime1 = repository.getUptime();
      
      // Aguarda um pouco
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const uptime2 = repository.getUptime();

      expect(uptime2).toBeGreaterThanOrEqual(uptime1);
    });
  });

  describe('getDatabaseStatus', () => {
    it('deve retornar status do banco de dados', () => {
      const dbStatus = repository.getDatabaseStatus();

      expect(dbStatus).toHaveProperty('provider');
      expect(dbStatus).toHaveProperty('status');
    });

    it('deve retornar status connected', () => {
      const dbStatus = repository.getDatabaseStatus();

      expect(dbStatus.status).toBe('connected');
    });

    it('deve usar PRISMA como provider padrão', () => {
      delete process.env.DATABASE_PROVIDER;

      const dbStatus = repository.getDatabaseStatus();

      expect(dbStatus.provider).toBe('PRISMA');
    });

    it('deve respeitar DATABASE_PROVIDER do env', () => {
      process.env.DATABASE_PROVIDER = 'POSTGRESQL';

      const dbStatus = repository.getDatabaseStatus();

      expect(dbStatus.provider).toBe('POSTGRESQL');
    });
  });

  describe('getNodeVersion', () => {
    it('deve retornar versão do Node.js', () => {
      const version = repository.getNodeVersion();

      expect(typeof version).toBe('string');
      expect(version).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('deve começar com "v"', () => {
      const version = repository.getNodeVersion();

      expect(version.startsWith('v')).toBe(true);
    });
  });

  describe('getPlatform', () => {
    it('deve retornar plataforma do sistema', () => {
      const platform = repository.getPlatform();

      expect(typeof platform).toBe('string');
      expect(platform.length).toBeGreaterThan(0);
    });

    it('deve retornar uma plataforma válida', () => {
      const platform = repository.getPlatform();
      const validPlatforms = ['darwin', 'linux', 'win32', 'freebsd', 'openbsd', 'sunos', 'aix'];

      expect(validPlatforms).toContain(platform);
    });
  });

  describe('getProcessId', () => {
    it('deve retornar ID do processo', () => {
      const pid = repository.getProcessId();

      expect(typeof pid).toBe('number');
      expect(pid).toBeGreaterThan(0);
    });

    it('deve retornar PID válido', () => {
      const pid = repository.getProcessId();

      // PID deve ser um inteiro positivo
      expect(Number.isInteger(pid)).toBe(true);
      expect(pid).toBeGreaterThan(0);
    });

    it('deve retornar o mesmo PID em chamadas consecutivas', () => {
      const pid1 = repository.getProcessId();
      const pid2 = repository.getProcessId();

      expect(pid1).toBe(pid2);
    });
  });
});


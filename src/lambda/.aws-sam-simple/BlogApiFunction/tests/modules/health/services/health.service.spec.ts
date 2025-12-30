import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../../../../src/modules/health/services/health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBasicHealth', () => {
    it('should return basic health status', async () => {
      const result = await service.getBasicHealth();
      
      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return a valid ISO timestamp', async () => {
      const result = await service.getBasicHealth();
      
      expect(() => new Date(result.timestamp)).not.toThrow();
    });
  });

  describe('getDetailedHealth', () => {
    it('should return detailed health status with memory info', async () => {
      const result = await service.getDetailedHealth();
      
      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('database');
      
      // Check memory structure
      expect(result.memory).toHaveProperty('used');
      expect(result.memory).toHaveProperty('total');
      expect(result.memory).toHaveProperty('percentage');
      
      // Check database structure
      expect(result.database).toHaveProperty('status', 'connected');
      expect(result.database).toHaveProperty('provider');
    });

    it('should return valid memory usage data', async () => {
      const result = await service.getDetailedHealth();
      
      expect(typeof result.memory.used).toBe('number');
      expect(typeof result.memory.total).toBe('number');
      expect(typeof result.memory.percentage).toBe('number');
      
      expect(result.memory.used).toBeGreaterThanOrEqual(0);
      expect(result.memory.total).toBeGreaterThanOrEqual(0);
      expect(result.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(result.memory.percentage).toBeLessThanOrEqual(100);
    });

    it('should return database provider info', async () => {
      const result = await service.getDetailedHealth();
      
      expect(result.database.provider).toBe('MongoDB/DynamoDB');
      expect(result.database.status).toBe('connected');
    });
  });
});

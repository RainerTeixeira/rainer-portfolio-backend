import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../../../../src/modules/health/controllers/health.controller';
import { HealthService } from '../../../../src/modules/health/services/health.service';

describe('HealthController', () => {
  let controller: HealthController;

  const mockHealthService = {
    getBasicHealth: jest.fn(),
    getDetailedHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

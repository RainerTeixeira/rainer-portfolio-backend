import { Test, TestingModule } from '@nestjs/testing';
import { MongoDBService } from './mongodb.service';

describe('MongoDBService', () => {
  let service: MongoDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MongoDBService],
    }).compile();

    service = module.get<MongoDBService>(MongoDBService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

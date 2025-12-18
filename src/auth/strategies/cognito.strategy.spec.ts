import { Test, TestingModule } from '@nestjs/testing';
import { CognitoStrategy } from './cognito.strategy';
import { AuthService } from '../auth.service';

describe('CognitoStrategy', () => {
  let strategy: CognitoStrategy;

  const mockAuthService = {
    decodeJWT: jest.fn(),
    syncUserWithDatabase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CognitoStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<CognitoStrategy>(CognitoStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });
});

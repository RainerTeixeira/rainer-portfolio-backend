import { Test, TestingModule } from '@nestjs/testing';
import { CognitoStrategy } from '../../../src/auth/strategies/cognito.strategy';
import { AuthService } from '../../../src/auth/auth.service';

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

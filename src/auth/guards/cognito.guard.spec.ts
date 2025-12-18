import { Test, TestingModule } from '@nestjs/testing';
import { CognitoGuard } from './cognito.guard';
import { AuthService } from '../auth.service';

describe('CognitoGuard', () => {
  let guard: CognitoGuard;

  const mockAuthService = {
    decodeJWT: jest.fn(),
    syncUserWithDatabase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CognitoGuard,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    guard = module.get<CognitoGuard>(CognitoGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
});

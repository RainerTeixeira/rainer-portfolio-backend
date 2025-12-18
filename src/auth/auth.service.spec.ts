import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../modules/users/services/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    getUserByCognitoSub: jest.fn(),
    createUser: jest.fn(),
    findByEmail: jest.fn(),
    findByCognitoSub: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('decodeJWT', () => {
    it('should decode valid JWT token', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(JSON.stringify({ sub: 'test', email: 'test@example.com' })).toString('base64url');
      const signature = 'signature';
      const token = `${header}.${payload}.${signature}`;

      const result = (service as any).decodeJWT(token);

      expect(result).toEqual({
        sub: 'test',
        email: 'test@example.com',
      });
    });

    it('should return empty object for invalid token', () => {
      const invalidToken = 'invalid.token';

      const result = (service as any).decodeJWT(invalidToken);

      expect(result).toEqual({});
    });

    it('should handle malformed JWT token', () => {
      const malformedToken = 'invalid';

      const result = (service as any).decodeJWT(malformedToken);

      expect(result).toEqual({});
    });
  });

  describe('syncUserWithDatabase', () => {
    it('should create new user if not exists', async () => {
      const payload = {
        sub: 'test-cognito-sub',
        email: 'test@example.com',
        name: 'Test User',
        nickname: 'testuser',
      };

      mockUsersService.getUserByCognitoSub.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue({ id: '1' } as any);

      // Call private method through reflection
      await (service as any).syncUserWithDatabase(payload);

      expect(mockUsersService.getUserByCognitoSub).toHaveBeenCalledWith('test-cognito-sub');
      expect(mockUsersService.createUser).toHaveBeenCalledWith({
        cognitoSub: 'test-cognito-sub',
        fullName: 'Test User',
        email: 'test@example.com',
        nickname: 'testuser',
      });
    });

    it('should not create user if already exists', async () => {
      const payload = {
        sub: 'test-cognito-sub',
        email: 'test@example.com',
      };

      const existingUser = { id: '1', cognitoSub: 'test-cognito-sub' };
      mockUsersService.getUserByCognitoSub.mockResolvedValue(existingUser);

      await (service as any).syncUserWithDatabase(payload);

      expect(mockUsersService.getUserByCognitoSub).toHaveBeenCalledWith('test-cognito-sub');
      expect(mockUsersService.createUser).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully without throwing', async () => {
      const payload = {
        sub: 'test-cognito-sub',
        email: 'test@example.com',
      };

      mockUsersService.getUserByCognitoSub.mockRejectedValue(new Error('Database error'));

      // Should not throw error even if database operations fail
      await expect((service as any).syncUserWithDatabase(payload)).resolves.toBeUndefined();
    });
  });
});

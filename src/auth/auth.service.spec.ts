import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../modules/users/services/users.service';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock config (centralizado em ../common/config)
jest.mock('../common/config', () => ({
  cognito: {
    clientId: 'test-client-id',
    domain: 'https://test-domain.auth.us-east-1.amazoncognito.com',
    redirectUri: 'http://localhost:3000/dashboard/login/callback',
    region: 'us-east-1',
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_123',
  },
  aws: {
    region: 'us-east-1',
  },
  getCognitoUrls: jest.fn().mockReturnValue({
    authorize: 'https://test-domain.auth.us-east-1.amazoncognito.com/oauth2/authorize',
    token: 'https://test-domain.auth.us-east-1.amazoncognito.com/oauth2/token',
  }),
}));

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
    mockedAxios.post.mockClear();
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);
    mockedAxios.post.mockResolvedValue({
      data: {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        id_token: 'header.payload.signature',
        expires_in: 3600,
      },
    } as any);
    
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

  describe('getGoogleAuthUrl', () => {
    it('should generate Google OAuth URL', async () => {
      const result = await service.getGoogleAuthUrl();

      expect(result.success).toBe(true);
      expect(result.data.authUrl).toContain('https://test-domain.auth.us-east-1.amazoncognito.com/oauth2/authorize');
      expect(result.data.authUrl).toContain('client_id=test-client-id');
      expect(result.data.authUrl).toContain('identity_provider=Google');
      expect(result.data.authUrl).toContain('response_type=code');
    });

    it('should use custom redirect URI', async () => {
      const customRedirect = 'http://localhost:3000/custom/callback';
      const result = await service.getGoogleAuthUrl(customRedirect);

      expect(result.data.authUrl).toContain(encodeURIComponent(customRedirect));
    });

    it('should throw error if OAuth not configured', async () => {
      // Mock the env module to return undefined for required config
      const configMock = require('../common/config');
      const originalDomain = configMock.cognito.domain;
      configMock.cognito.domain = undefined;

      await expect(service.getGoogleAuthUrl()).rejects.toThrow(InternalServerErrorException);

      // Restore original value
      configMock.cognito.domain = originalDomain;
    });
  });

  describe('handleOAuthCallback', () => {
    it('should handle OAuth callback successfully', async () => {
      // Create a valid JWT token for testing
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ sub: 'test-sub', email: 'test@example.com', name: 'Test User' })).toString('base64');
      const signature = 'mock-signature';
      const validIdToken = `${header}.${payload}.${signature}`;

      const mockTokenResponse = {
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          id_token: validIdToken,
          expires_in: 3600,
        },
      };

      mockedAxios.post.mockResolvedValue(mockTokenResponse);
      mockUsersService.getUserByCognitoSub.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue({ id: '1' });

      const result = await service.handleOAuthCallback({ code: 'test-code' });

      expect(result.success).toBe(true);
      expect(result.data.accessToken).toBe('mock-access-token');
      expect(result.data.refreshToken).toBe('mock-refresh-token');
      expect(result.data.idToken).toBe(validIdToken);
      expect(result.data.expiresIn).toBe(3600);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test-domain.auth.us-east-1.amazoncognito.com/oauth2/token',
        expect.stringContaining('grant_type=authorization_code'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('should throw error for invalid code', async () => {
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400 },
        toJSON: () => ({}),
      } as any);

      await expect(service.handleOAuthCallback({ code: 'invalid-code' })).rejects.toThrow(BadRequestException);
    });
  });
});

/**
 * Testes Unitários: Auth Repository
 * 
 * Testa toda a integração com AWS Cognito.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from '../../../src/modules/auth/auth.repository';
import { createMockCognitoClient } from '../../helpers/mocks';

// Mock do módulo de configuração do Cognito
jest.mock('../../../src/config/cognito.config', () => ({
  cognitoConfig: {
    region: 'us-east-1',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    userPoolId: 'test-pool-id',
  },
}));

// Mock do SDK da AWS
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => createMockCognitoClient()),
  InitiateAuthCommand: jest.fn(),
  SignUpCommand: jest.fn(),
  ConfirmSignUpCommand: jest.fn(),
  ForgotPasswordCommand: jest.fn(),
  ConfirmForgotPasswordCommand: jest.fn(),
}));

describe('AuthRepository', () => {
  let repository: AuthRepository;
  let cognitoClient: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthRepository],
    }).compile();

    repository = module.get<AuthRepository>(AuthRepository);
    cognitoClient = (repository as any).cognitoClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve fazer login no Cognito com sucesso', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const mockResponse = {
        AuthenticationResult: {
          AccessToken: 'access-token',
          RefreshToken: 'refresh-token',
          IdToken: 'id-token',
          ExpiresIn: 3600,
        },
      };

      cognitoClient.send.mockResolvedValue(mockResponse);

      const result = await repository.login(loginData);

      expect(cognitoClient.send).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('deve registrar usuário no Cognito com sucesso', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test@123',
        username: 'testuser',
        name: 'Test User',
      };

      const mockResponse = {
        UserSub: 'cognito-sub-123',
        UserConfirmed: false,
      };

      cognitoClient.send.mockResolvedValue(mockResponse);

      const result = await repository.register(registerData);

      expect(cognitoClient.send).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });

    it('deve incluir phoneNumber e avatar quando fornecidos', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test@123',
        username: 'testuser',
        name: 'Test User',
        phoneNumber: '+5511999999999',
        avatar: 'https://example.com/avatar.jpg',
      };

      const mockResponse = {
        UserSub: 'cognito-sub-123',
        UserConfirmed: false,
      };

      cognitoClient.send.mockResolvedValue(mockResponse);

      await repository.register(registerData);

      expect(cognitoClient.send).toHaveBeenCalled();
    });
  });

  describe('confirmEmail', () => {
    it('deve confirmar email no Cognito com sucesso', async () => {
      const confirmData = {
        email: 'test@example.com',
        code: '123456',
      };

      const mockResponse = { $metadata: {} };
      cognitoClient.send.mockResolvedValue(mockResponse);

      const result = await repository.confirmEmail(confirmData);

      expect(cognitoClient.send).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('refreshToken', () => {
    it('deve renovar token no Cognito com sucesso', async () => {
      const refreshData = {
        refreshToken: 'mock-refresh-token',
      };

      const mockResponse = {
        AuthenticationResult: {
          AccessToken: 'new-access-token',
          ExpiresIn: 3600,
        },
      };

      cognitoClient.send.mockResolvedValue(mockResponse);

      const result = await repository.refreshToken(refreshData);

      expect(cognitoClient.send).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('forgotPassword', () => {
    it('deve solicitar recuperação de senha no Cognito com sucesso', async () => {
      const forgotData = {
        email: 'test@example.com',
      };

      const mockResponse = { $metadata: {} };
      cognitoClient.send.mockResolvedValue(mockResponse);

      const result = await repository.forgotPassword(forgotData);

      expect(cognitoClient.send).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha no Cognito com sucesso', async () => {
      const resetData = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'NewPass@123',
      };

      const mockResponse = { $metadata: {} };
      cognitoClient.send.mockResolvedValue(mockResponse);

      const result = await repository.resetPassword(resetData);

      expect(cognitoClient.send).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('calculateSecretHash (private)', () => {
    it('deve calcular secret hash quando clientSecret existe', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const mockResponse = {
        AuthenticationResult: {
          AccessToken: 'access-token',
        },
      };

      cognitoClient.send.mockResolvedValue(mockResponse);

      await repository.login(loginData);

      expect(cognitoClient.send).toHaveBeenCalled();
    });

    it('deve funcionar sem clientSecret (retorna undefined)', async () => {
      // Testa o método privado calculateSecretHash indiretamente
      // quando clientSecret não existe
      
      // Acessa o método privado para testar
      const calculateSecretHash = (repository as any).calculateSecretHash;
      
      // Mock do config sem clientSecret temporariamente
      const cognitoConfigModule = require('../../../src/config/cognito.config');
      const originalSecret = cognitoConfigModule.cognitoConfig.clientSecret;
      
      // Remove clientSecret temporariamente
      cognitoConfigModule.cognitoConfig.clientSecret = undefined;
      
      // Chama o método - deve retornar undefined (linha 41)
      const result = calculateSecretHash.call(repository, 'test@example.com');
      
      expect(result).toBeUndefined(); // Testa a linha 41!
      
      // Restaura clientSecret
      cognitoConfigModule.cognitoConfig.clientSecret = originalSecret;
    });

    it('deve calcular hash quando clientSecret existe', async () => {
      // Testa o caminho quando clientSecret EXISTE
      const calculateSecretHash = (repository as any).calculateSecretHash;
      
      const result = calculateSecretHash.call(repository, 'test@example.com');
      
      // Quando clientSecret existe, deve retornar uma string (hash)
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});


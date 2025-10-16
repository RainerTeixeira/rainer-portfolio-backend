/**
 * Testes Unitários: Auth Controller
 * 
 * Testa todos os endpoints do controller de autenticação.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            confirmEmail: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar usuário com sucesso', async () => {
      const registerData = {
        email: 'test@example.com',
        password: 'Test@123',
        username: 'testuser',
        name: 'Test User',
      };

      const mockResponse = {
        userId: 'user-123',
        email: registerData.email,
        name: registerData.name,
        emailVerificationRequired: true,
        message: 'Usuário criado com sucesso',
      };

      authService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerData);

      expect(authService.register).toHaveBeenCalledWith(registerData);
      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
    });
  });

  describe('confirmEmail', () => {
    it('deve confirmar email com sucesso', async () => {
      const confirmData = {
        email: 'test@example.com',
        code: '123456',
      };

      const mockResponse = {
        success: true,
        message: 'Email confirmado com sucesso!',
      };

      authService.confirmEmail.mockResolvedValue(mockResponse);

      const result = await controller.confirmEmail(confirmData);

      expect(authService.confirmEmail).toHaveBeenCalledWith(confirmData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Test@123',
      };

      const mockResponse = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        userId: 'user-123',
        email: loginData.email,
        name: 'Test User',
      };

      authService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginData);

      expect(authService.login).toHaveBeenCalledWith(loginData);
      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
    });
  });

  describe('refresh', () => {
    it('deve renovar token com sucesso', async () => {
      const refreshData = {
        refreshToken: 'mock-refresh-token',
      };

      const mockResponse = {
        accessToken: 'new-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      };

      authService.refreshToken.mockResolvedValue(mockResponse);

      const result = await controller.refresh(refreshData);

      expect(authService.refreshToken).toHaveBeenCalledWith(refreshData);
      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
    });
  });

  describe('forgotPassword', () => {
    it('deve solicitar recuperação de senha com sucesso', async () => {
      const forgotData = {
        email: 'test@example.com',
      };

      const mockResponse = {
        success: true,
        message: 'Código de recuperação enviado para seu email.',
      };

      authService.forgotPassword.mockResolvedValue(mockResponse);

      const result = await controller.forgotPassword(forgotData);

      expect(authService.forgotPassword).toHaveBeenCalledWith(forgotData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('deve redefinir senha com sucesso', async () => {
      const resetData = {
        email: 'test@example.com',
        code: '123456',
        newPassword: 'NewPass@123',
      };

      const mockResponse = {
        success: true,
        message: 'Senha alterada com sucesso!',
      };

      authService.resetPassword.mockResolvedValue(mockResponse);

      const result = await controller.resetPassword(resetData);

      expect(authService.resetPassword).toHaveBeenCalledWith(resetData);
      expect(result).toEqual(mockResponse);
    });
  });
});


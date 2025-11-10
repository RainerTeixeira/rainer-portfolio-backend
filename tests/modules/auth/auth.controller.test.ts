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
            startOAuth: jest.fn(),
            handleOAuthCallback: jest.fn(),
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
        fullName: 'Test User',
        nickname: 'testuser',
      };

      const mockResponse = {
        userId: 'user-123',
        email: registerData.email,
        fullName: registerData.fullName,
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
        username: 'testuser',
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
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          idToken: 'mock-id-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
        },
        user: {
          id: 'user-123',
          cognitoSub: 'cognito-sub-123',
          email: loginData.email,
          fullName: 'Test User',
          avatar: undefined,
          bio: undefined,
          website: undefined,
          socialLinks: undefined,
          role: 'subscriber',
          isActive: true,
          isBanned: false,
          postsCount: 0,
          commentsCount: 0,
        },
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
        idToken: 'mock-id-token',
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

  describe('OAuth', () => {
    describe('startOAuth', () => {
      it('deve redirecionar para Google OAuth via Cognito Hosted UI', async () => {
        const redirectUri = 'http://localhost:2600/auth/oauth/callback?provider=google';
        const mockAuthUrl = 'https://cognito-domain.auth.region.amazoncognito.com/oauth2/authorize?...';
        
        const res = {
          redirect: jest.fn(),
        } as any;

        authService.startOAuth.mockResolvedValue(mockAuthUrl);

        await controller.startOAuth('google', redirectUri, res);

        expect(authService.startOAuth).toHaveBeenCalledWith('google', redirectUri);
        expect(res.redirect).toHaveBeenCalledWith(mockAuthUrl);
      });

      it('deve redirecionar para GitHub OAuth via Cognito Hosted UI', async () => {
        const redirectUri = 'http://localhost:2600/auth/oauth/callback?provider=github';
        const mockAuthUrl = 'https://cognito-domain.auth.region.amazoncognito.com/oauth2/authorize?...';
        
        const res = {
          redirect: jest.fn(),
        } as any;

        authService.startOAuth.mockResolvedValue(mockAuthUrl);

        await controller.startOAuth('github', redirectUri, res);

        expect(authService.startOAuth).toHaveBeenCalledWith('github', redirectUri);
        expect(res.redirect).toHaveBeenCalledWith(mockAuthUrl);
      });

      it('deve lançar erro se redirect_uri não for fornecido', async () => {
        const res = {
          redirect: jest.fn(),
        } as any;

        await expect(
          controller.startOAuth('google', '', res)
        ).rejects.toThrow('redirect_uri é obrigatório');
      });
    });

    describe('handleOAuthCallback', () => {
      it('deve processar callback OAuth com sucesso', async () => {
        const callbackData = { 
          code: 'auth-code-123',
          state: 'mock-state',
          redirectUri: 'http://localhost:4000/callback'
        };
        const provider = 'google';

        const mockResponse = {
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            idToken: 'mock-id-token',
            tokenType: 'Bearer',
            expiresIn: 3600,
          },
          user: {
            id: 'user-123',
            cognitoSub: 'cognito-sub-123',
            email: 'user@example.com',
            fullName: 'Test User',
            avatar: undefined,
            bio: undefined,
            website: undefined,
            socialLinks: undefined,
            role: 'subscriber',
            isActive: true,
            isBanned: false,
            postsCount: 0,
            commentsCount: 0,
          },
        };

        authService.handleOAuthCallback.mockResolvedValue(mockResponse);

        const result = await controller.handleOAuthCallback(callbackData, provider);

        expect(authService.handleOAuthCallback).toHaveBeenCalledWith(
          provider,
          callbackData.code,
          callbackData.state,
          callbackData.redirectUri
        );
        expect(result).toEqual({
          success: true,
          data: mockResponse,
        });
      });

      it('deve lançar erro se código não for fornecido', async () => {
        await expect(
          controller.handleOAuthCallback({ code: '' }, 'google')
        ).rejects.toThrow('Código de autorização é obrigatório');
      });

      it('deve lançar erro se provider for inválido', async () => {
        await expect(
          controller.handleOAuthCallback({ code: 'auth-code-123' }, 'invalid-provider')
        ).rejects.toThrow('Provedor OAuth inválido');
      });
    });
  });
});


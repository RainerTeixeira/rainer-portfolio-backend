/**
 * Testes Unitários: Auth Service
 * 
 * Testa toda a lógica de negócio do serviço de autenticação.
 * Cobertura: 100%
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { AuthRepository } from '../../../src/modules/auth/auth.repository';
import { UsersService } from '../../../src/modules/users/users.service';
import {
  createMockUser,
  createMockCognitoAuthResponse,
  createMockCognitoSignUpResponse,
} from '../../helpers/mocks';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            login: jest.fn(),
            register: jest.fn(),
            confirmEmail: jest.fn(),
            refreshToken: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getUserByCognitoSub: jest.fn(),
            createUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository) as jest.Mocked<AuthRepository>;
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Test@123',
    };

    const mockIdToken = Buffer.from(
      JSON.stringify({
        sub: 'cognito-sub-123',
        email: 'test@example.com',
        name: 'Test User',
        'cognito:username': 'testuser',
      })
    ).toString('base64');

    it('deve fazer login com sucesso quando usuário já existe', async () => {
      const mockUser = createMockUser();
      const mockCognitoResponse = {
        ...createMockCognitoAuthResponse(),
        AuthenticationResult: {
          ...createMockCognitoAuthResponse().AuthenticationResult,
          IdToken: `header.${mockIdToken}.signature`,
        },
      };

      authRepository.login.mockResolvedValue(mockCognitoResponse);
      usersService.getUserByCognitoSub.mockResolvedValue(mockUser);

      const result = await service.login(loginData);

      expect(authRepository.login).toHaveBeenCalledWith(loginData);
      expect(usersService.getUserByCognitoSub).toHaveBeenCalledWith('cognito-sub-123');
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        userId: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it('deve criar usuário automaticamente se não existir', async () => {
      const mockUser = createMockUser();
      const mockCognitoResponse = {
        ...createMockCognitoAuthResponse(),
        AuthenticationResult: {
          ...createMockCognitoAuthResponse().AuthenticationResult,
          IdToken: `header.${mockIdToken}.signature`,
        },
      };

      authRepository.login.mockResolvedValue(mockCognitoResponse);
      usersService.getUserByCognitoSub.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(mockUser);

      const result = await service.login(loginData);

      expect(usersService.createUser).toHaveBeenCalledWith({
        cognitoSub: 'cognito-sub-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });
      expect(result.userId).toBe(mockUser.id);
    });

    it('deve usar email como username quando cognito:username não existe', async () => {
      const mockUser = createMockUser();
      
      // Token sem cognito:username
      const mockIdTokenWithoutUsername = Buffer.from(
        JSON.stringify({
          sub: 'cognito-sub-123',
          email: 'test@example.com',
          name: 'Test User',
        })
      ).toString('base64');

      const mockCognitoResponse = {
        ...createMockCognitoAuthResponse(),
        AuthenticationResult: {
          ...createMockCognitoAuthResponse().AuthenticationResult,
          IdToken: `header.${mockIdTokenWithoutUsername}.signature`,
        },
      };

      authRepository.login.mockResolvedValue(mockCognitoResponse);
      usersService.getUserByCognitoSub.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(mockUser);

      await service.login(loginData);

      expect(usersService.createUser).toHaveBeenCalledWith({
        cognitoSub: 'cognito-sub-123',
        email: 'test@example.com',
        username: 'test',  // email split('@')[0]
        name: 'Test User',
      });
    });

    it('deve usar preferred_username quando cognito:username não existe', async () => {
      const mockUser = createMockUser();
      
      // Token com preferred_username mas sem cognito:username
      const mockIdTokenWithPreferred = Buffer.from(
        JSON.stringify({
          sub: 'cognito-sub-123',
          email: 'test@example.com',
          name: 'Test User',
          preferred_username: 'preferreduser',
        })
      ).toString('base64');

      const mockCognitoResponse = {
        ...createMockCognitoAuthResponse(),
        AuthenticationResult: {
          ...createMockCognitoAuthResponse().AuthenticationResult,
          IdToken: `header.${mockIdTokenWithPreferred}.signature`,
        },
      };

      authRepository.login.mockResolvedValue(mockCognitoResponse);
      usersService.getUserByCognitoSub.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(mockUser);

      await service.login(loginData);

      expect(usersService.createUser).toHaveBeenCalledWith({
        cognitoSub: 'cognito-sub-123',
        email: 'test@example.com',
        username: 'preferreduser',  // preferred_username
        name: 'Test User',
      });
    });

    it('deve usar "Usuário" como nome padrão quando name não existe', async () => {
      const mockUser = createMockUser();
      
      // Token sem name
      const mockIdTokenWithoutName = Buffer.from(
        JSON.stringify({
          sub: 'cognito-sub-123',
          email: 'test@example.com',
          'cognito:username': 'testuser',
        })
      ).toString('base64');

      const mockCognitoResponse = {
        ...createMockCognitoAuthResponse(),
        AuthenticationResult: {
          ...createMockCognitoAuthResponse().AuthenticationResult,
          IdToken: `header.${mockIdTokenWithoutName}.signature`,
        },
      };

      authRepository.login.mockResolvedValue(mockCognitoResponse);
      usersService.getUserByCognitoSub.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue(mockUser);

      await service.login(loginData);

      expect(usersService.createUser).toHaveBeenCalledWith({
        cognitoSub: 'cognito-sub-123',
        email: 'test@example.com',
        username: 'testuser',
        name: 'Usuário',  // nome padrão
      });
    });

    it('deve lançar UnauthorizedException quando não há AuthenticationResult', async () => {
      authRepository.login.mockResolvedValue({ $metadata: {} } as any);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginData)).rejects.toThrow('Falha na autenticação');
    });

    it('deve lançar UnauthorizedException quando credenciais incorretas', async () => {
      const error: any = new Error('Not authorized');
      error.name = 'NotAuthorizedException';
      authRepository.login.mockRejectedValue(error);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginData)).rejects.toThrow('Email ou senha incorretos');
    });

    it('deve lançar UnauthorizedException quando email não confirmado', async () => {
      const error: any = new Error('User not confirmed');
      error.name = 'UserNotConfirmedException';
      authRepository.login.mockRejectedValue(error);

      await expect(service.login(loginData)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginData)).rejects.toThrow('Email não confirmado');
    });

    it('deve lançar InternalServerErrorException para outros erros', async () => {
      authRepository.login.mockRejectedValue(new Error('Unknown error'));

      await expect(service.login(loginData)).rejects.toThrow(InternalServerErrorException);
      await expect(service.login(loginData)).rejects.toThrow('Erro ao realizar login');
    });
  });

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'Test@123',
      username: 'newuser',
      name: 'New User',
    };

    it('deve registrar usuário com sucesso', async () => {
      const mockCognitoResponse = createMockCognitoSignUpResponse();
      const mockUser = createMockUser({ email: registerData.email });

      authRepository.register.mockResolvedValue(mockCognitoResponse);
      usersService.createUser.mockResolvedValue(mockUser);

      const result = await service.register(registerData);

      expect(authRepository.register).toHaveBeenCalledWith(registerData);
      expect(usersService.createUser).toHaveBeenCalledWith({
        cognitoSub: 'cognito-sub-123',
        email: registerData.email,
        username: registerData.username,
        name: registerData.name,
        avatar: undefined,
        role: 'AUTHOR',
      });
      expect(result).toEqual({
        userId: 'cognito-sub-123',
        email: registerData.email,
        name: registerData.name,
        emailVerificationRequired: true,
        message: expect.stringContaining('Verifique seu email'),
      });
    });

    it('deve retornar mensagem diferente quando usuário já está confirmado', async () => {
      const mockCognitoResponse = {
        $metadata: {},
        UserSub: 'cognito-sub-123',
        UserConfirmed: true,  // Usuário já confirmado
      };
      const mockUser = createMockUser({ email: registerData.email });

      authRepository.register.mockResolvedValue(mockCognitoResponse as any);
      usersService.createUser.mockResolvedValue(mockUser);

      const result = await service.register(registerData);

      expect(result).toEqual({
        userId: 'cognito-sub-123',
        email: registerData.email,
        name: registerData.name,
        emailVerificationRequired: false,
        message: 'Usuário criado com sucesso!',
      });
    });

    it('deve lançar BadRequestException quando email já existe no Cognito', async () => {
      const error: any = new Error('Username exists');
      error.name = 'UsernameExistsException';
      authRepository.register.mockRejectedValue(error);

      await expect(service.register(registerData)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerData)).rejects.toThrow('Email já cadastrado no Cognito');
    });

    it('deve lançar BadRequestException quando senha é inválida', async () => {
      const error: any = new Error('Invalid password');
      error.name = 'InvalidPasswordException';
      authRepository.register.mockRejectedValue(error);

      await expect(service.register(registerData)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerData)).rejects.toThrow('Senha não atende aos requisitos');
    });

    it('deve lançar BadRequestException para parâmetros inválidos', async () => {
      const error: any = new Error('Invalid parameter');
      error.name = 'InvalidParameterException';
      error.message = 'Email inválido';
      authRepository.register.mockRejectedValue(error);

      await expect(service.register(registerData)).rejects.toThrow(BadRequestException);
      await expect(service.register(registerData)).rejects.toThrow('Parâmetros inválidos: Email inválido');
    });

    it('deve lançar InternalServerErrorException para erros desconhecidos do Cognito', async () => {
      const error: any = new Error('Unknown Cognito error');
      error.name = 'UnknownException';
      authRepository.register.mockRejectedValue(error);

      await expect(service.register(registerData)).rejects.toThrow(InternalServerErrorException);
      await expect(service.register(registerData)).rejects.toThrow('Erro ao registrar usuário');
    });

    it('deve lançar ConflictException quando email já existe no MongoDB', async () => {
      const mockCognitoResponse = createMockCognitoSignUpResponse();
      const mongoError: any = new Error('Duplicate key');
      mongoError.code = 'P2002';

      authRepository.register.mockResolvedValue(mockCognitoResponse);
      usersService.createUser.mockRejectedValue(mongoError);

      await expect(service.register(registerData)).rejects.toThrow(ConflictException);
      await expect(service.register(registerData)).rejects.toThrow('Email ou username já cadastrado no sistema');
    });

    it('deve lançar InternalServerErrorException quando falha ao criar no MongoDB', async () => {
      const mockCognitoResponse = createMockCognitoSignUpResponse();
      authRepository.register.mockResolvedValue(mockCognitoResponse);
      usersService.createUser.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerData)).rejects.toThrow(InternalServerErrorException);
      await expect(service.register(registerData)).rejects.toThrow('Erro ao criar perfil do usuário');
    });
  });

  describe('confirmEmail', () => {
    const confirmData = {
      email: 'test@example.com',
      code: '123456',
    };

    it('deve confirmar email com sucesso', async () => {
      authRepository.confirmEmail.mockResolvedValue({ $metadata: {} } as any);

      const result = await service.confirmEmail(confirmData);

      expect(authRepository.confirmEmail).toHaveBeenCalledWith(confirmData);
      expect(result).toEqual({
        success: true,
        message: 'Email confirmado com sucesso!',
      });
    });

    it('deve lançar BadRequestException quando código é inválido', async () => {
      const error: any = new Error('Code mismatch');
      error.name = 'CodeMismatchException';
      authRepository.confirmEmail.mockRejectedValue(error);

      await expect(service.confirmEmail(confirmData)).rejects.toThrow(BadRequestException);
      await expect(service.confirmEmail(confirmData)).rejects.toThrow('Código de confirmação inválido');
    });

    it('deve lançar BadRequestException quando código expirou', async () => {
      const error: any = new Error('Expired code');
      error.name = 'ExpiredCodeException';
      authRepository.confirmEmail.mockRejectedValue(error);

      await expect(service.confirmEmail(confirmData)).rejects.toThrow(BadRequestException);
      await expect(service.confirmEmail(confirmData)).rejects.toThrow('Código de confirmação expirado');
    });

    it('deve lançar InternalServerErrorException para outros erros', async () => {
      const error: any = new Error('Unknown error');
      error.name = 'UnknownException';
      authRepository.confirmEmail.mockRejectedValue(error);

      await expect(service.confirmEmail(confirmData)).rejects.toThrow(InternalServerErrorException);
      await expect(service.confirmEmail(confirmData)).rejects.toThrow('Erro ao confirmar email');
    });
  });

  describe('refreshToken', () => {
    const refreshData = {
      refreshToken: 'mock-refresh-token',
    };

    it('deve renovar token com sucesso', async () => {
      const mockCognitoResponse = createMockCognitoAuthResponse();
      authRepository.refreshToken.mockResolvedValue(mockCognitoResponse);

      const result = await service.refreshToken(refreshData);

      expect(authRepository.refreshToken).toHaveBeenCalledWith(refreshData);
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
    });

    it('deve lançar UnauthorizedException quando refresh token inválido', async () => {
      const error: any = new Error('Not authorized');
      error.name = 'NotAuthorizedException';
      authRepository.refreshToken.mockRejectedValue(error);

      await expect(service.refreshToken(refreshData)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshData)).rejects.toThrow('Refresh token inválido ou expirado');
    });

    it('deve lançar UnauthorizedException quando não há AuthenticationResult', async () => {
      const mockResponse = { 
        $metadata: {},
        AuthenticationResult: undefined 
      } as any;
      
      authRepository.refreshToken.mockResolvedValue(mockResponse);

      await expect(service.refreshToken(refreshData)).rejects.toThrow(UnauthorizedException);
      await expect(service.refreshToken(refreshData)).rejects.toThrow('Falha ao renovar token');
    });

    it('deve lançar InternalServerErrorException para outros erros', async () => {
      const error: any = new Error('Unknown error');
      error.name = 'UnknownException';
      authRepository.refreshToken.mockRejectedValue(error);

      await expect(service.refreshToken(refreshData)).rejects.toThrow(InternalServerErrorException);
      await expect(service.refreshToken(refreshData)).rejects.toThrow('Erro ao renovar token');
    });
  });

  describe('forgotPassword', () => {
    const forgotData = {
      email: 'test@example.com',
    };

    it('deve solicitar recuperação de senha com sucesso', async () => {
      authRepository.forgotPassword.mockResolvedValue({ $metadata: {} } as any);

      const result = await service.forgotPassword(forgotData);

      expect(authRepository.forgotPassword).toHaveBeenCalledWith(forgotData);
      expect(result).toEqual({
        success: true,
        message: 'Código de recuperação enviado para seu email.',
      });
    });

    it('deve retornar mensagem genérica quando usuário não encontrado', async () => {
      const error: any = new Error('User not found');
      error.name = 'UserNotFoundException';
      authRepository.forgotPassword.mockRejectedValue(error);

      const result = await service.forgotPassword(forgotData);

      expect(result).toEqual({
        success: true,
        message: 'Se o email existir, você receberá um código de recuperação.',
      });
    });

    it('deve lançar InternalServerErrorException para outros erros', async () => {
      const error: any = new Error('Service error');
      error.name = 'ServiceException';
      authRepository.forgotPassword.mockRejectedValue(error);

      await expect(service.forgotPassword(forgotData)).rejects.toThrow(InternalServerErrorException);
      await expect(service.forgotPassword(forgotData)).rejects.toThrow('Erro ao solicitar recuperação de senha');
    });
  });

  describe('resetPassword', () => {
    const resetData = {
      email: 'test@example.com',
      code: '123456',
      newPassword: 'NewPass@123',
    };

    it('deve redefinir senha com sucesso', async () => {
      authRepository.resetPassword.mockResolvedValue({ $metadata: {} } as any);

      const result = await service.resetPassword(resetData);

      expect(authRepository.resetPassword).toHaveBeenCalledWith(resetData);
      expect(result).toEqual({
        success: true,
        message: 'Senha alterada com sucesso!',
      });
    });

    it('deve lançar BadRequestException quando código inválido', async () => {
      const error: any = new Error('Code mismatch');
      error.name = 'CodeMismatchException';
      authRepository.resetPassword.mockRejectedValue(error);

      await expect(service.resetPassword(resetData)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(resetData)).rejects.toThrow('Código de recuperação inválido');
    });

    it('deve lançar BadRequestException quando senha não atende requisitos', async () => {
      const error: any = new Error('Invalid password');
      error.name = 'InvalidPasswordException';
      authRepository.resetPassword.mockRejectedValue(error);

      await expect(service.resetPassword(resetData)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(resetData)).rejects.toThrow('Senha não atende aos requisitos de segurança');
    });

    it('deve lançar BadRequestException quando código expirou', async () => {
      const error: any = new Error('Expired code');
      error.name = 'ExpiredCodeException';
      authRepository.resetPassword.mockRejectedValue(error);

      await expect(service.resetPassword(resetData)).rejects.toThrow(BadRequestException);
      await expect(service.resetPassword(resetData)).rejects.toThrow('Código de recuperação expirado');
    });

    it('deve lançar InternalServerErrorException para outros erros', async () => {
      const error: any = new Error('Unknown error');
      error.name = 'UnknownException';
      authRepository.resetPassword.mockRejectedValue(error);

      await expect(service.resetPassword(resetData)).rejects.toThrow(InternalServerErrorException);
      await expect(service.resetPassword(resetData)).rejects.toThrow('Erro ao redefinir senha');
    });
  });

  describe('decodeToken (private)', () => {
    it('deve decodificar token JWT válido', async () => {
      const payload = { sub: 'test-sub', email: 'test@example.com' };
      const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
      const token = `header.${encodedPayload}.signature`;

      const mockCognitoResponse = {
        ...createMockCognitoAuthResponse(),
        AuthenticationResult: {
          ...createMockCognitoAuthResponse().AuthenticationResult,
          IdToken: token,
        },
      };

      const mockUser = createMockUser();
      authRepository.login.mockResolvedValue(mockCognitoResponse);
      usersService.getUserByCognitoSub.mockResolvedValue(mockUser);

      const result = await service.login({ email: 'test@example.com', password: 'Pass@123' });

      expect(result.userId).toBe(mockUser.id);
    });

    it('deve lançar UnauthorizedException quando token inválido', async () => {
      const mockCognitoResponse = {
        ...createMockCognitoAuthResponse(),
        AuthenticationResult: {
          ...createMockCognitoAuthResponse().AuthenticationResult,
          IdToken: 'invalid.token',
        },
      };

      authRepository.login.mockResolvedValue(mockCognitoResponse);

      await expect(service.login({ email: 'test@example.com', password: 'Pass@123' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});


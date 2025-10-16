import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { AuthRepository } from './auth.repository.js';
import { UsersService } from '../users/users.service.js';
import { UserRole } from '../users/user.model.js';
import type {
  LoginData,
  RegisterData,
  RefreshTokenData,
  ConfirmEmailData,
  ForgotPasswordData,
  ResetPasswordData,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
} from './auth.model.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersService: UsersService,
  ) {}

  async login(data: LoginData): Promise<LoginResponse> {
    try {
      // 1. Autentica no Cognito
      const response = await this.authRepository.login(data);

      if (!response.AuthenticationResult) {
        throw new UnauthorizedException('Falha na autenticação');
      }

      const { AccessToken, RefreshToken, ExpiresIn, IdToken } = response.AuthenticationResult;
      const payload = this.decodeToken(IdToken!);

      // 2. Busca ou cria usuário no MongoDB
      let user = await this.usersService.getUserByCognitoSub(payload.sub);
      
      if (!user) {
        // Primeira vez que o usuário faz login - cria perfil
        // Isso pode acontecer se o usuário foi criado no Cognito antes da integração
        const username = payload['cognito:username'] || payload.preferred_username || payload.email.split('@')[0];
        
        user = await this.usersService.createUser({
          cognitoSub: payload.sub,
          email: payload.email,
          username: username,
          name: payload.name || 'Usuário',
        });
      }

      return {
        accessToken: AccessToken!,
        refreshToken: RefreshToken!,
        tokenType: 'Bearer',
        expiresIn: ExpiresIn!,
        userId: user.id,  // ID do MongoDB
        email: user.email,
        name: user.name,
      };
    } catch (error: any) {
      if (error.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Email ou senha incorretos');
      }
      if (error.name === 'UserNotConfirmedException') {
        throw new UnauthorizedException('Email não confirmado. Verifique seu email.');
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao realizar login');
    }
  }

  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      // 1. Registra no Cognito
      const cognitoResponse = await this.authRepository.register(data);
      const cognitoSub = cognitoResponse.UserSub!;

      // 2. Cria perfil no MongoDB
      try {
        await this.usersService.createUser({
          cognitoSub: cognitoSub,
          email: data.email,
          username: data.username,
          name: data.name,
          avatar: data.avatar,
          role: UserRole.AUTHOR,  // Padrão para novos usuários
        });
      } catch (mongoError: any) {
        // Se falhar ao criar no MongoDB, loga o erro
        console.error('Erro ao criar usuário no MongoDB:', mongoError);
        
        // Verifica se é erro de duplicação
        if (mongoError.code === 'P2002') {
          throw new ConflictException('Email ou username já cadastrado no sistema');
        }
        
        throw new InternalServerErrorException('Erro ao criar perfil do usuário');
      }

      return {
        userId: cognitoSub,
        email: data.email,
        name: data.name,
        emailVerificationRequired: !cognitoResponse.UserConfirmed,
        message: cognitoResponse.UserConfirmed
          ? 'Usuário criado com sucesso!'
          : 'Usuário criado com sucesso. Verifique seu email para confirmar o cadastro.',
      };
    } catch (error: any) {
      if (error.name === 'UsernameExistsException') {
        throw new BadRequestException('Email já cadastrado no Cognito');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new BadRequestException('Senha não atende aos requisitos de segurança');
      }
      if (error.name === 'InvalidParameterException') {
        throw new BadRequestException('Parâmetros inválidos: ' + error.message);
      }
      if (error instanceof BadRequestException || error instanceof ConflictException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao registrar usuário');
    }
  }

  async confirmEmail(data: ConfirmEmailData) {
    try {
      await this.authRepository.confirmEmail(data);
      return { success: true, message: 'Email confirmado com sucesso!' };
    } catch (error: any) {
      if (error.name === 'CodeMismatchException') {
        throw new BadRequestException('Código de confirmação inválido');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new BadRequestException('Código de confirmação expirado');
      }
      throw new InternalServerErrorException('Erro ao confirmar email');
    }
  }

  async refreshToken(data: RefreshTokenData): Promise<RefreshTokenResponse> {
    try {
      const response = await this.authRepository.refreshToken(data);

      if (!response.AuthenticationResult) {
        throw new UnauthorizedException('Falha ao renovar token');
      }

      const { AccessToken, ExpiresIn } = response.AuthenticationResult;

      return {
        accessToken: AccessToken!,
        refreshToken: data.refreshToken,
        tokenType: 'Bearer',
        expiresIn: ExpiresIn!,
      };
    } catch (error: any) {
      // Se já é UnauthorizedException, propaga
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Refresh token inválido ou expirado');
      }
      throw new InternalServerErrorException('Erro ao renovar token');
    }
  }

  async forgotPassword(data: ForgotPasswordData) {
    try {
      await this.authRepository.forgotPassword(data);
      return { success: true, message: 'Código de recuperação enviado para seu email.' };
    } catch (error: any) {
      if (error.name === 'UserNotFoundException') {
        return { success: true, message: 'Se o email existir, você receberá um código de recuperação.' };
      }
      throw new InternalServerErrorException('Erro ao solicitar recuperação de senha');
    }
  }

  async resetPassword(data: ResetPasswordData) {
    try {
      await this.authRepository.resetPassword(data);
      return { success: true, message: 'Senha alterada com sucesso!' };
    } catch (error: any) {
      if (error.name === 'CodeMismatchException') {
        throw new BadRequestException('Código de recuperação inválido');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new BadRequestException('Código de recuperação expirado');
      }
      if (error.name === 'InvalidPasswordException') {
        throw new BadRequestException('Senha não atende aos requisitos de segurança');
      }
      throw new InternalServerErrorException('Erro ao redefinir senha');
    }
  }

  private decodeToken(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Token JWT inválido');
      }
      const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
      return JSON.parse(payload);
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}


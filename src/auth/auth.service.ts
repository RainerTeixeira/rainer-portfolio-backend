/**
 * @fileoverview Serviço de Autenticação
 * 
 * Serviço responsável por gerenciar toda a autenticação de usuários
 * utilizando AWS Cognito como provider de identidade.
 * 
 * @module auth/auth.service
 * @version 1.0.0
 * @since 2025-12-16
 * @author Rainer Soft
 * @license MIT
 */

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UsersService } from '../modules/users/services/users.service';
import { env } from '../config/env';
import type {
  LoginDto,
  SignupDto,
  RefreshTokenDto,
  ConfirmEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

/**
 * Serviço de autenticação utilizando AWS Cognito.
 * 
 * Responsável por:
 * - Login e logout de usuários
 * - Registro de novos usuários
 * - Confirmação de email
 * - Refresh de tokens
 * - Recuperação de senha
 * - Sincronização com banco de dados local
 * 
 * @class AuthService
 * 
 * @example
 * ```typescript
 * // Login de usuário
 * const result = await authService.login({
 *   email: 'user@example.com',
 *   password: 'senha123'
 * });
 * ```
 * 
 * @since 1.0.0
 */
@Injectable()
export class AuthService {
  /**
   * Logger para registro de eventos e erros.
   * 
   * @private
   * @type {Logger}
   */
  private readonly logger = new Logger(AuthService.name);
  
  /**
   * Cliente AWS Cognito Identity Provider.
   * 
   * @private
   * @type {CognitoIdentityProviderClient}
   */
  private readonly client: CognitoIdentityProviderClient;

  /**
   * Cria uma instância do AuthService.
   * 
   * @constructor
   * @param {UsersService} usersService - Serviço de usuários para sincronização
   */
  constructor(private readonly usersService: UsersService) {
    this.client = new CognitoIdentityProviderClient({
      region: env.AWS_REGION,
    });
  }

  /**
   * Autentica um usuário com email e senha.
   * 
   * @async
   * @method login
   * @param {LoginDto} loginData - Dados de login
   * @returns {Promise<object>} Tokens de autenticação
   * 
   * @throws {UnauthorizedException} Credenciais inválidas
   * 
   * @example
   * ```typescript
   * const auth = await authService.login({
   *   email: 'user@example.com',
   *   password: 'senha123'
   * });
   * // Returns: { accessToken, refreshToken, idToken, expiresIn }
   * ```
   */
  async login(loginData: LoginDto) {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: env.COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: loginData.email,
          PASSWORD: loginData.password,
        },
      });

      const response = await this.client.send(command);

      if (response.AuthenticationResult) {
        // Buscar ou criar usuário no MongoDB
        const payload = this.decodeJWT(response.AuthenticationResult.IdToken || '');
        await this.syncUserWithDatabase(payload);

        return {
          success: true,
          data: {
            accessToken: response.AuthenticationResult.AccessToken,
            refreshToken: response.AuthenticationResult.RefreshToken,
            idToken: response.AuthenticationResult.IdToken,
            expiresIn: response.AuthenticationResult.ExpiresIn,
          },
        };
      }

      throw new UnauthorizedException('Authentication failed');
    } catch (error) {
      this.logger.error('Login error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  /**
   * Registra um novo usuário no sistema.
   * 
   * @async
   * @method signup
   * @param {SignupDto} signupData - Dados de registro
   * @returns {Promise<object>} Resultado do registro
   * 
   * @throws {ConflictException} Usuário já existe
   * @throws {InternalServerErrorException} Falha no registro
   * 
   * @example
   * ```typescript
   * const result = await authService.signup({
   *   email: 'novo@exemplo.com',
   *   password: 'senha123',
   *   fullName: 'Novo Usuário',
   *   nickname: 'novousuario'
   * });
   * ```
   */
  async signup(signupData: SignupDto) {
    try {
      const command = new SignUpCommand({
        ClientId: env.COGNITO_CLIENT_ID,
        Username: signupData.email,
        Password: signupData.password,
        UserAttributes: [
          { Name: 'email', Value: signupData.email },
          { Name: 'name', Value: signupData.fullName },
          ...(signupData.nickname ? [{ Name: 'nickname', Value: signupData.nickname }] : []),
        ],
      });

      await this.client.send(command);

      return {
        success: true,
        message: 'User registered successfully. Please check your email for confirmation.',
      };
    } catch (error) {
      this.logger.error('Signup error:', error);
      if ((error as any).name === 'UsernameExistsException') {
        throw new ConflictException('User already exists');
      }
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /**
   * Confirma o email do usuário após registro.
   * 
   * @async
   * @method confirmEmail
   * @param {ConfirmEmailDto} confirmData - Dados de confirmação
   * @returns {Promise<object>} Resultado da confirmação
   * 
   * @throws {BadRequestException} Código inválido
   * 
   * @example
   * ```typescript
   * const result = await authService.confirmEmail({
   *   token: '123456'
   * });
   * ```
   */
  async confirmEmail(confirmData: ConfirmEmailDto) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: env.COGNITO_CLIENT_ID,
        Username: confirmData.token, // Na prática, seria o email
        ConfirmationCode: confirmData.token,
      });

      await this.client.send(command);

      return {
        success: true,
        message: 'Email confirmed successfully',
      };
    } catch (error) {
      this.logger.error('Confirm email error:', error);
      throw new BadRequestException('Invalid confirmation code');
    }
  }

  /**
   * Renova o token de acesso usando refresh token.
   * 
   * @async
   * @method refreshToken
   * @param {RefreshTokenDto} refreshData - Refresh token
   * @returns {Promise<object>} Novos tokens
   * 
   * @throws {UnauthorizedException} Refresh token inválido
   * 
   * @example
   * ```typescript
   * const tokens = await authService.refreshToken({
   *   refreshToken: 'eyJhbGciOi...'
   * });
   * ```
   */
  async refreshToken(refreshData: RefreshTokenDto) {
    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: env.COGNITO_CLIENT_ID,
        AuthParameters: {
          REFRESH_TOKEN: refreshData.refreshToken,
        },
      });

      const response = await this.client.send(command);

      if (response.AuthenticationResult) {
        return {
          success: true,
          data: {
            accessToken: response.AuthenticationResult.AccessToken,
            idToken: response.AuthenticationResult.IdToken,
            expiresIn: response.AuthenticationResult.ExpiresIn,
          },
        };
      }

      throw new UnauthorizedException('Token refresh failed');
    } catch (error) {
      this.logger.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Inicia o processo de recuperação de senha.
   * 
   * @async
   * @method forgotPassword
   * @param {ForgotPasswordDto} forgotData - Email do usuário
   * @returns {Promise<object>} Confirmação de envio
   * 
   * @throws {BadRequestException} Falha ao enviar código
   * 
   * @example
   * ```typescript
   * const result = await authService.forgotPassword({
   *   email: 'user@example.com'
   * });
   * ```
   */
  async forgotPassword(forgotData: ForgotPasswordDto) {
    try {
      const command = new ForgotPasswordCommand({
        ClientId: env.COGNITO_CLIENT_ID,
        Username: forgotData.email,
      });

      await this.client.send(command);

      return {
        success: true,
        message: 'Password reset code sent to email',
      };
    } catch (error) {
      this.logger.error('Forgot password error:', error);
      throw new BadRequestException('Failed to send reset code');
    }
  }

  /**
   * Redefine a senha do usuário com código de confirmação.
   * 
   * @async
   * @method resetPassword
   * @param {ResetPasswordDto} resetData - Novos dados de senha
   * @returns {Promise<object>} Confirmação de redefinição
   * 
   * @throws {BadRequestException} Código ou senha inválidos
   * 
   * @example
   * ```typescript
   * const result = await authService.resetPassword({
   *   token: '123456',
   *   newPassword: 'novaSenha123'
   * });
   * ```
   */
  async resetPassword(resetData: ResetPasswordDto) {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: env.COGNITO_CLIENT_ID,
        Username: resetData.token, // Na prática, seria o email
        ConfirmationCode: resetData.token,
        Password: resetData.newPassword,
      });

      await this.client.send(command);

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      this.logger.error('Reset password error:', error);
      throw new BadRequestException('Invalid reset code or password');
    }
  }

  /**
   * Sincroniza usuário do Cognito com banco de dados local.
   * 
   * @private
   * @async
   * @method syncUserWithDatabase
   * @param {any} payload - Payload decodificado do token JWT
   * @returns {Promise<void>}
   */
  private async syncUserWithDatabase(payload: any) {
    try {
      // Verificar se usuário já existe
      let user = await this.usersService.getUserByCognitoSub(payload.sub);

      if (!user) {
        // Criar usuário no MongoDB
        await this.usersService.createUser({
          cognitoSub: payload.sub,
          fullName: payload.name || payload['cognito:username'] || 'User',
          email: payload.email,
          nickname: payload.nickname,
        });
      }
    } catch (error) {
      this.logger.error('Error syncing user with database:', error);
      // Não falhar a autenticação se a sincronização falhar
    }
  }

  /**
   * Decodifica token JWT sem verificar assinatura.
   * 
   * @private
   * @method decodeJWT
   * @param {string} token - Token JWT
   * @returns {any} Payload decodificado
   * 
   * @example
   * ```typescript
   * const payload = this.decodeJWT('eyJhbGciOi...');
   * // Returns: { sub, email, name, ... }
   * ```
   */
  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      const payload = Buffer.from(parts[1], 'base64').toString();
      return JSON.parse(payload);
    } catch (error) {
      this.logger.error('Error decoding JWT:', error);
      return {};
    }
  }
}

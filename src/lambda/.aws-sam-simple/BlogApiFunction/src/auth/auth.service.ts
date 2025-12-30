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
  RequestTimeoutException,
  ServiceUnavailableException,
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
import { aws, cognito, getCognitoUrls } from '../common/config';
import axios from 'axios';
import type {
  LoginDto,
  SignupDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  OAuthCallbackDto,
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
      region: aws.region,
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
        ClientId: cognito.clientId,
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
      if (!cognito.clientId) {
        throw new BadRequestException('Cognito clientId is not configured');
      }

      const command = new SignUpCommand({
        ClientId: cognito.clientId,
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
      const err: any = error;

      if (err?.name === 'UsernameExistsException') {
        throw new ConflictException('User already exists');
      }

      // Erros típicos quando Cognito/AWS não está acessível ou credenciais não são válidas
      if (
        err?.name === 'UnrecognizedClientException' ||
        err?.name === 'InvalidSignatureException' ||
        err?.name === 'AccessDeniedException'
      ) {
        throw new ServiceUnavailableException('Cognito is unavailable or AWS credentials are invalid');
      }

      if (err?.name === 'TooManyRequestsException') {
        throw new RequestTimeoutException('Cognito rate limit exceeded');
      }

      // Validação do Cognito (senha fraca, formato inválido etc.)
      if (err?.name === 'InvalidPasswordException' || err?.name === 'InvalidParameterException') {
        throw new BadRequestException(err?.message || 'Invalid signup data');
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
  async confirmEmail(confirmData: { email: string; token: string }) {
    try {
      const command = new ConfirmSignUpCommand({
        ClientId: cognito.clientId,
        Username: confirmData.email,
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
        ClientId: cognito.clientId,
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
        ClientId: cognito.clientId,
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
   *   email: 'user@example.com',
   *   token: '123456',
   *   newPassword: 'novaSenha123'
   * });
   * ```
   */
  async resetPassword(resetData: ResetPasswordDto) {
    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: cognito.clientId,
        Username: resetData.email,
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
   * Cache de estados CSRF para validação OAuth.
   * Em produção, use Redis ou DynamoDB.
   * 
   * @private
   * @type {Map<string, number>}
   */
  private readonly stateCache = new Map<string, number>();

  /**
   * Gera URL de autenticação do Google via Cognito Hosted UI.
   * 
   * @async
   * @method getGoogleAuthUrl
   * @param {string} [redirectUri] - URI de redirecionamento customizada
   * @returns {Promise<object>} URL de autenticação com state token
   * 
   * @example
   * ```typescript
   * const result = await authService.getGoogleAuthUrl();
   * // Returns: { success: true, data: { authUrl: 'https://...', state: 'abc123' } }
   * ```
   */
  async getGoogleAuthUrl(redirectUri?: string) {
    try {
      if (!cognito.domain || !cognito.clientId) {
        throw new InternalServerErrorException('OAuth not configured');
      }

      const redirect = redirectUri || cognito.redirectUri;
      if (!redirect) {
        throw new InternalServerErrorException('Redirect URI not configured');
      }

      // Gerar state CSRF token
      const state = Buffer.from(JSON.stringify({ 
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(7)
      })).toString('base64');

      // Armazenar state para validação (expira em 10 minutos)
      this.stateCache.set(state, Date.now() + 10 * 60 * 1000);

      const cognitoUrls = getCognitoUrls();
      const authUrl = `${cognitoUrls.authorize}?` +
        `client_id=${cognito.clientId}&` +
        `response_type=code&` +
        `scope=email+openid+profile&` +
        `redirect_uri=${encodeURIComponent(redirect)}&` +
        `identity_provider=Google&` +
        `state=${state}`;

      return {
        success: true,
        data: { authUrl, state },
      };
    } catch (error) {
      this.logger.error('Get Google auth URL error:', error);
      throw new InternalServerErrorException('Failed to generate auth URL');
    }
  }

  /**
   * Processa callback OAuth e troca código por tokens.
   * 
   * @async
   * @method handleOAuthCallback
   * @param {OAuthCallbackDto} callbackData - Dados do callback OAuth
   * @returns {Promise<object>} Tokens de autenticação
   * 
   * @throws {UnauthorizedException} State CSRF inválido
   * @throws {BadRequestException} Código inválido
   * 
   * @example
   * ```typescript
   * const tokens = await authService.handleOAuthCallback({
   *   code: 'auth_code_123',
   *   state: 'csrf_token_abc'
   * });
   * ```
   */
  async handleOAuthCallback(callbackData: OAuthCallbackDto) {
    try {
      // Validar state CSRF
      if (callbackData.state) {
        const expiresAt = this.stateCache.get(callbackData.state);
        if (!expiresAt || Date.now() > expiresAt) {
          throw new UnauthorizedException('Invalid or expired CSRF state token');
        }
        // Remover state após uso (one-time use)
        this.stateCache.delete(callbackData.state);
      }

      if (!cognito.domain || !cognito.clientId) {
        throw new InternalServerErrorException('OAuth not configured');
      }

      const redirect = cognito.redirectUri;
      if (!redirect) {
        throw new InternalServerErrorException('Redirect URI not configured');
      }

      const cognitoUrls = getCognitoUrls();
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: cognito.clientId,
        code: callbackData.code,
        redirect_uri: redirect,
      });

      const response = await axios.post(cognitoUrls.token, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000, // 10 segundos
      });

      const { access_token, refresh_token, id_token, expires_in } = response.data;

      // Sincronizar usuário com banco de dados
      const payload = this.decodeJWT(id_token);
      await this.syncUserWithDatabase(payload);

      return {
        success: true,
        data: {
          accessToken: access_token,
          refreshToken: refresh_token,
          idToken: id_token,
          expiresIn: expires_in,
        },
      };
    } catch (error) {
      // Erros de rede/timeout do Axios
      if (axios.isAxiosError(error)) {
        this.logger.error('Falha na requisição OAuth:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          code: error.code
        });
        
        if (error.code === 'ECONNABORTED') {
          throw new InternalServerErrorException('Timeout na requisição de token OAuth');
        }
        
        if (error.response?.status === 400) {
          throw new BadRequestException('Código de autorização inválido');
        }
        
        if (error.response?.status === 401) {
          throw new UnauthorizedException('Falha na autenticação OAuth do cliente');
        }
        
        if (error.response?.status === 429) {
          throw new RequestTimeoutException('Muitas tentativas de OAuth, tente novamente mais tarde');
        }
        
        throw new InternalServerErrorException('Erro no provedor OAuth');
      }
      
      // Erros de decodificação JWT
      if (error instanceof Error && (
        error.message.includes('JWT') || 
        error.message.includes('token') ||
        error.message.includes('decode')
      )) {
        this.logger.error('Erro na decodificação JWT:', error);
        throw new UnauthorizedException('Token inválido recebido do provedor OAuth');
      }
      
      // Erros de sincronização com banco de dados
      if (error instanceof Error && (
        error.message.includes('database') ||
        error.message.includes('sync') ||
        error.message.includes('MongoDB')
      )) {
        this.logger.error('Falha na sincronização com banco:', error);
        throw new InternalServerErrorException('Falha ao sincronizar conta do usuário');
      }
      
      // Erros de configuração (repassar como estão)
      if (error instanceof InternalServerErrorException && 
          (error.message.includes('not configured') || 
           error.message.includes('OAuth'))) {
        this.logger.error('Erro de configuração OAuth:', error.message);
        throw error;
      }
      
      // Erros CSRF state (já tratados acima, mas garante repasse)
      if (error instanceof UnauthorizedException) {
        this.logger.error('Erro de validação CSRF:', error.message);
        throw error;
      }
      
      // Log genérico para erros não esperados
      this.logger.error('Erro inesperado no callback OAuth:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        callbackData: { 
          hasCode: !!callbackData.code, 
          hasState: !!callbackData.state 
        }
      });
      
      throw new InternalServerErrorException('Falha ao processar callback OAuth');
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
      const user = await this.usersService.getUserByCognitoSub(payload.sub);

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
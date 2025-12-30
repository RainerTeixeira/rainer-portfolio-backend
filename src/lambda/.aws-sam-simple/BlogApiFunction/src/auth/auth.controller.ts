/**
 * @fileoverview Controller de Autenticação
 *
 * Controller responsável por expor endpoints HTTP para autenticação
 * via AWS Cognito com suporte a email/senha e Google OAuth.
 *
 * Responsabilidades:
 * - Login de usuários (email/senha)
 * - Registro via Cognito
 * - OAuth com Google via Cognito Hosted UI
 * - Refresh de tokens
 * - Confirmação de email
 * - Recuperação de senha
 *
 * @module auth/controllers/auth.controller
 */

import { Body, Controller, Post, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { 
  LoginDto, 
  SignupDto, 
  RefreshTokenDto, 
  ForgotPasswordDto, 
  ResetPasswordDto, 
  OAuthCallbackDto 
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Realiza login do usuário via email e senha
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '🔐 Login do Usuário',
    description: 'Autentica usuário com email e senha via AWS Cognito'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'Password123!' }
      },
      required: ['email', 'password']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login realizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            expiresIn: { type: 'number', example: 3600 },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                email: { type: 'string', example: 'user@example.com' },
                fullName: { type: 'string', example: 'John Doe' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() credentials: LoginDto) {
    return await this.authService.login(credentials);
  }

  /**
   * Registra novo usuário no Cognito
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: '📝 Registrar Usuário',
    description: 'Cria nova conta de usuário no AWS Cognito'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'newuser@example.com' },
        password: { type: 'string', example: 'Password123!' },
        fullName: { type: 'string', example: 'New User' }
      },
      required: ['email', 'password', 'fullName']
    }
  })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  async register(@Body() userData: SignupDto) {
    return await this.authService.signup(userData);
  }

  /**
   * Confirma email após registro
   */
  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '✅ Confirmar Email',
    description: 'Confirma email do usuário com código enviado por email'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        token: { type: 'string', example: '123456' }
      },
      required: ['email', 'token']
    }
  })
  @ApiResponse({ status: 200, description: 'Email confirmado com sucesso' })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  async confirmEmail(@Body() confirmData: { email: string; token: string }) {
    return await this.authService.confirmEmail({ ...confirmData });
  }

  /**
   * Inicia recuperação de senha
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '🔑 Esqueci Minha Senha',
    description: 'Envia código de recuperação de senha por email'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' }
      },
      required: ['email']
    }
  })
  @ApiResponse({ status: 200, description: 'Código enviado por email' })
  @ApiResponse({ status: 400, description: 'Email não encontrado' })
  async forgotPassword(@Body() forgotData: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotData);
  }

  /**
   * Redefine senha com código
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '🔄 Redefinir Senha',
    description: 'Redefine senha usando código de confirmação'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        token: { type: 'string', example: '123456' },
        newPassword: { type: 'string', example: 'NewPassword123!' }
      },
      required: ['email', 'token', 'newPassword']
    }
  })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Código inválido ou senha fraca' })
  async resetPassword(@Body() resetData: ResetPasswordDto) {
    return await this.authService.resetPassword({ ...resetData });
  }

  /**
   * Inicia fluxo OAuth com Google via Cognito Hosted UI
   */
  @Get('oauth/google')
  @ApiOperation({ 
    summary: '🔗 Login com Google',
    description: 'Redireciona para Cognito Hosted UI para login com Google'
  })
  @ApiQuery({ name: 'redirect_uri', required: false, description: 'URI de redirecionamento após login' })
  @ApiResponse({ 
    status: 200, 
    description: 'URL de redirecionamento para Cognito Hosted UI',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            authUrl: { type: 'string', example: 'https://your-domain.auth.region.amazoncognito.com/oauth2/authorize?...' }
          }
        }
      }
    }
  })
  async googleOAuth(@Query('redirect_uri') redirectUri?: string) {
    return await this.authService.getGoogleAuthUrl(redirectUri);
  }

  /**
   * Callback do OAuth do Cognito
   */
  @Get('oauth/callback')
  @ApiOperation({ 
    summary: '🔄 OAuth Callback',
    description: 'Processa callback OAuth do Cognito e troca código por tokens'
  })
  @ApiQuery({ name: 'code', required: true, description: 'Código de autorização OAuth' })
  @ApiQuery({ name: 'state', required: false, description: 'Parâmetro de estado CSRF' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tokens obtidos com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            idToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            expiresIn: { type: 'number', example: 3600 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Código inválido ou expirado' })
  async oauthCallback(
    @Query('code') code: string,
    @Query('state') state?: string
  ) {
    const payload: OAuthCallbackDto = { code, state };
    return await this.authService.handleOAuthCallback(payload);
  }

  /**
   * Renova tokens de acesso
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '🔄 Refresh Token',
    description: 'Renova accessToken usando refreshToken'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' }
      },
      required: ['refreshToken']
    }
  })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(@Body() body: RefreshTokenDto) {
    return await this.authService.refreshToken({ refreshToken: body.refreshToken });
  }
}

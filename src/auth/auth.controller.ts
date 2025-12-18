/**
 * @fileoverview Controller de Autenticação
 *
 * Controller responsável por expor endpoints HTTP para autenticação
 * via AWS Cognito.
 *
 * Responsabilidades:
 * - Login de usuários
 * - Registro via Cognito
 * - OAuth callbacks (Google, GitHub)
 * - Refresh de tokens
 *
 * @module auth/controllers/auth.controller
 */

import { Body, Controller, Post, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';

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
  async login(@Body() credentials: { email: string; password: string }) {
    const result = await this.authService.login(credentials);
    return { success: true, data: result };
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
  async register(@Body() userData: { email: string; password: string; fullName: string }) {
    const result = await this.authService.signup(userData);
    return { success: true, data: result };
  }

  /**
   * Inicia fluxo OAuth com Google
   */
  @Get('oauth/google')
  @ApiOperation({ 
    summary: '🔗 Login com Google',
    description: 'Inicia fluxo OAuth2 com Google (não implementado)'
  })
  @ApiQuery({ name: 'redirect_uri', required: false, description: 'URI de redirecionamento após login' })
  @ApiResponse({ status: 501, description: 'Não implementado' })
  async googleOAuth(@Query('redirect_uri') _redirectUri?: string) {
    return { success: false, message: 'OAuth não implementado ainda' };
  }

  /**
   * Inicia fluxo OAuth com GitHub
   */
  @Get('oauth/github')
  @ApiOperation({ 
    summary: '🔗 Login com GitHub',
    description: 'Inicia fluxo OAuth2 com GitHub (não implementado)'
  })
  @ApiQuery({ name: 'redirect_uri', required: false, description: 'URI de redirecionamento após login' })
  @ApiResponse({ status: 501, description: 'Não implementado' })
  async githubOAuth(@Query('redirect_uri') _redirectUri?: string) {
    return { success: false, message: 'OAuth não implementado ainda' };
  }

  /**
   * Callback do OAuth (Google/GitHub)
   */
  @Get('oauth/callback')
  @ApiOperation({ 
    summary: '🔄 OAuth Callback',
    description: 'Processa callback OAuth do provedor (não implementado)'
  })
  @ApiQuery({ name: 'code', required: true, description: 'Código de autorização OAuth' })
  @ApiQuery({ name: 'state', required: false, description: 'Parâmetro de estado CSRF' })
  @ApiQuery({ name: 'provider', required: true, description: 'Provedor OAuth (google/github)' })
  @ApiResponse({ status: 501, description: 'Não implementado' })
  async oauthCallback(
    @Query('code') _code: string,
    @Query('state') _state?: string,
    @Query('provider') _provider: string = 'google'
  ) {
    return { success: false, message: 'OAuth callback não implementado ainda' };
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
  async refresh(@Body() body: { refreshToken: string }) {
    const result = await this.authService.refreshToken({ refreshToken: body.refreshToken });
    return { success: true, data: result };
  }

  /**
   * Logout do usuário
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '🚪 Logout',
    description: 'Invalida tokens do usuário no Cognito (não implementado)'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' }
      },
      required: ['accessToken']
    }
  })
  @ApiResponse({ status: 501, description: 'Não implementado' })
  async logout(@Body() _body: { accessToken: string }) {
    return { success: false, message: 'Logout não implementado ainda' };
  }
}

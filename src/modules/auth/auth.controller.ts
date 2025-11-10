/**
 * Controlador de Autenticação
 *
 * Endpoints públicos de autenticação e verificação de disponibilidade.
 * Delegam a orquestração de regras ao `AuthService` e documentam o contrato
 * via Swagger. Nenhuma regra de negócio deve residir aqui.
 *
 * @module modules/auth/auth.controller
 */
import { Controller, Post, Body, Get, Query, HttpCode, HttpStatus, Res, BadRequestException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service.js';
import type {
  LoginData,
  RegisterData,
  RefreshTokenData,
  ConfirmEmailData,
  ForgotPasswordData,
  ResetPasswordData,
} from './auth.model.js';

@ApiTags('🔐 Autenticação')
@Controller('auth')
/**
 * Controller de Autenticação
 *
 * Convenções:
 * - Retorno padronizado: `{ success: true, data }` e mensagens claras em erro.
 * - Todas as operações delegam regras ao `AuthService` (sem lógica no controller).
 *
 * Integração Swagger:
 * - `@ApiTags`, `@ApiOperation`, `@ApiBody`, `@ApiResponse` com schemas e exemplos.
 *
 */
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  /**
   * Verifica se um nickname (nickname) está disponível
   */
  @Post('check-nickname')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔍 Verificar Disponibilidade de Nickname' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        nickname: { type: 'string', example: 'mynick' },
        excludeCognitoSub: { type: 'string', example: 'abc-123-xyz' },
      },
      required: ['nickname'],
    },
  })
  @ApiResponse({ status: 200, description: 'Verificação concluída com sucesso' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  /**
   * Verifica disponibilidade de nickname (nickname).
   */
  async checkNickname(
    @Body() data: { nickname: string; excludeCognitoSub?: string },
  ) {
    if (!data.nickname) {
      return { success: false, message: 'O parâmetro nickname é obrigatório' };
    }

    const isAvailable = await this.authService.checkUsernameAvailability(
      data.nickname, 
      data.excludeCognitoSub
    );
    
    return { 
      success: true, 
      data: { 
        available: isAvailable,
        message: isAvailable 
          ? 'Este nickname está disponível' 
          : 'Este nickname já está em uso',
        nickname: data.nickname
      } 
    };
  }

  /**
   * Verifica se um nome completo está disponível
   */
  @Post('check-fullName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔍 Verificar Disponibilidade de Nome' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string', example: 'João da Silva' },
      },
      required: ['fullName'],
    },
  })
  @ApiResponse({ status: 200, description: 'Verificação concluída com sucesso' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  /**
   * Verifica disponibilidade de nome completo.
   */
  async checkName(
    @Body() data: { fullName: string },
  ) {
    if (!data.fullName) {
      return { success: false, message: 'O parâmetro fullName é obrigatório' };
    }

    const isAvailable = await this.authService.checkNameAvailability(data.fullName);
    
    return { 
      success: true, 
      data: { 
        available: isAvailable,
        message: isAvailable 
          ? 'Este nome está disponível' 
          : 'Este nome já está em uso',
        fullName: data.fullName
      } 
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '📝 Registrar Usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'fullName'],
      properties: {
        email: { 
          type: 'string', 
          format: 'email', 
          example: 'user@example.com',
          description: 'Único no Cognito (email não pode se repetir)'
        },
        password: { 
          type: 'string', 
          example: 'SenhaForte123!',
          minLength: 8 
        },
        fullName: { 
          type: 'string', 
          example: 'Nome Completo',
          minLength: 3,
          description: 'Único no MongoDB (fullName não pode se repetir)'
        },
        nickname: { 
          type: 'string', 
          example: 'nickname',
          minLength: 3,
          maxLength: 30,
          pattern: '^[a-zA-Z0-9_]+$',
          description: 'Opcional. Pode conter letras, números e underscore'
        },
        phoneNumber: { 
          type: 'string', 
          example: '+5511999999999' 
        },
        avatar: { 
          type: 'string', 
          format: 'uri', 
          example: 'https://example.com/avatar.jpg' 
        }
      }
    },
  })
  /**
   * Registra novo usuário (Cognito + persistência de perfil).
   */
  async register(@Body() data: RegisterData) {
    const result = await this.authService.register(data);
    return { success: true, data: result };
  }

  @Post('confirm-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '✅ Confirmar Email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        code: { type: 'string', example: '123456' },
      },
      required: ['email', 'code'],
    },
  })
  /**
   * Confirma e-mail com código enviado pelo Cognito.
   */
  async confirmEmail(@Body() data: ConfirmEmailData) {
    return await this.authService.confirmEmail(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔐 Login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'SenhaForte123!' },
      },
      required: ['email', 'password'],
    },
  })
  /**
   * Efetua login com credenciais.
   */
  async login(@Body() data: LoginData) {
    const result = await this.authService.login(data);
    return { success: true, data: result };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔄 Renovar Token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      },
      required: ['refreshToken'],
    },
  })
  /**
   * Renova tokens usando refreshToken.
   */
  async refresh(@Body() data: RefreshTokenData) {
    const result = await this.authService.refreshToken(data);
    return { success: true, data: result };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '❓ Esqueci Minha Senha' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
      required: ['email'],
    },
  })
  /**
   * Inicia fluxo de esqueci minha senha.
   */
  async forgotPassword(@Body() data: ForgotPasswordData) {
    return await this.authService.forgotPassword(data);
  }

  @Post('resend-confirmation-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '✉️ Reenviar Código de Confirmação' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
      required: ['email'],
    },
  })
  /**
   * Reenvia código de confirmação de e-mail.
   */
  async resendConfirmationCode(@Body() data: { email: string }) {
    return await this.authService.resendConfirmationCode(data.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔑 Redefinir Senha' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        code: { type: 'string', example: '123456' },
        newPassword: { type: 'string', example: 'NovaSenhaForte123!' },
      },
      required: ['email', 'code', 'newPassword'],
    },
  })
  /**
   * Redefine senha com código de verificação.
   */
  async resetPassword(@Body() data: ResetPasswordData) {
    return await this.authService.resetPassword(data);
  }

  @Post('change-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '✉️ Alterar Email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cognitoSub: { type: 'string', example: 'abc-123-xyz' },
        newEmail: { type: 'string', example: 'newemail@example.com' },
      },
      required: ['cognitoSub', 'newEmail'],
    },
  })
  /**
   * Solicita alteração de e-mail (envio de código para novo e-mail).
   */
  async changeEmail(@Body() data: { cognitoSub: string; newEmail: string }) {
    return await this.authService.changeEmail(data.cognitoSub, data.newEmail);
  }

  @Post('verify-email-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '✅ Verificar Alteração de Email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cognitoSub: { type: 'string', example: 'abc-123-xyz' },
        code: { type: 'string', example: '123456' },
      },
      required: ['cognitoSub', 'code'],
    },
  })
  /**
   * Verifica código de alteração de e-mail e confirma mudança.
   */
  async verifyEmailChange(@Body() data: { cognitoSub: string; code: string }) {
    return await this.authService.verifyEmailChange(data.cognitoSub, data.code);
  }


  @Get('needs-nickname/:cognitoSub')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '❓ Verifica se Usuário Precisa Escolher Nickname',
    description: 'Verifica se usuário OAuth (Google/GitHub) precisa escolher um nickname na primeira vez'
  })
  @ApiParam({ name: 'cognitoSub', description: 'CognitoSub do usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Retorna se precisa escolher nickname',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            needsNickname: { type: 'boolean', description: 'true se precisa escolher nickname' },
            hasNickname: { type: 'boolean', description: 'true se já tem nickname no Cognito' },
            cognitoSub: { type: 'string', description: 'CognitoSub do usuário' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  /**
   * Verifica se usuário precisa escolher nickname (OAuth)
   */
  async checkNeedsNickname(@Param('cognitoSub') cognitoSub: string) {
    const result = await this.authService.checkNeedsNickname(cognitoSub);
    return { success: true, data: result };
  }

  @Post('change-nickname')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '✏️ Altera o Nickname do Usuário',
    description: 'Altera o nickname do usuário e salva no Cognito. Use após login OAuth quando needsNickname=true'
  })
  @ApiBody({
    description: 'Dados para alteração de nickname',
    schema: {
      type: 'object',
      properties: {
        cognitoSub: { type: 'string', description: 'ID do usuário no Cognito' },
        newNickname: { type: 'string', description: 'Novo nickname (apenas letras e números, 3-30 caracteres)' },
      },
      required: ['cognitoSub', 'newNickname'],
    },
  })
  /**
   * Altera o nickname do usuário.
   */
  async changeNickname(@Body() data: { cognitoSub: string; newNickname: string }) {
    return await this.authService.changeNickname(data.cognitoSub, data.newNickname);
  }

  @Post('verify-email-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '✅ Verificar E-mail Administrativamente' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        identifier: { 
          type: 'string', 
          example: 'f48854d8-7081-704a-1756-077f177aee4e', 
          description: 'ID do usuário no Cognito (sub) ou username' 
        },
      },
      required: ['identifier'],
    },
  })
  @ApiResponse({ status: 200, description: 'E-mail verificado com sucesso' })
  @ApiResponse({ status: 400, description: 'Usuário não possui e-mail cadastrado' })
  /**
   * Verifica o e-mail do usuário administrativamente.
   * Útil para resolver casos onde o usuário não consegue verificar o e-mail normalmente.
   * Aceita tanto o cognitoSub (sub) quanto o username como identificador.
   */
  async verifyEmailAdmin(@Body() data: { identifier: string }) {
    return await this.authService.verifyEmailAdmin(data.identifier);
  }

  /**
   * Inicia fluxo OAuth com provedor (via Cognito Hosted UI)
   */
  @Get('oauth/:provider')
  @HttpCode(HttpStatus.TEMPORARY_REDIRECT)
  @ApiOperation({ summary: '🔐 Iniciar Login OAuth (backend-mediated)' })
  @ApiParam({ name: 'provider', enum: ['google', 'github'] })
  @ApiQuery({ name: 'redirect_uri', required: true, description: 'URI de callback após autenticação (frontend)' })
  @ApiResponse({ status: 302, description: 'Redireciona para Cognito Hosted UI com o provedor escolhido' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos' })
  async startOAuth(
    @Param('provider') provider: 'google' | 'github',
    @Query('redirect_uri') redirectUri: string,
    @Res() res: Response,
  ) {
    if (!redirectUri) {
      throw new BadRequestException('redirect_uri é obrigatório');
    }
    const authUrl = await this.authService.startOAuth(provider, redirectUri);
    res.redirect(authUrl);
  }

  /**
   * Processa callback OAuth e retorna tokens
   */
  @Post('oauth/:provider/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '🔄 Processar Callback OAuth' })
  @ApiParam({ name: 'provider', enum: ['google', 'github'], description: 'Provedor OAuth' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Código de autorização recebido do provedor OAuth' },
      },
      required: ['code'],
    },
  })
  @ApiResponse({ status: 200, description: 'Tokens de autenticação gerados com sucesso' })
  @ApiResponse({ status: 400, description: 'Código inválido ou expirado' })
  @ApiResponse({ status: 401, description: 'Falha na autenticação OAuth' })
  async handleOAuthCallback(
    @Body() data: { code: string; state?: string; redirectUri?: string },
    @Param('provider') provider: string,
  ) {
    if (!data.code) {
      throw new BadRequestException('Código de autorização é obrigatório');
    }

    if (provider !== 'google' && provider !== 'github') {
      throw new BadRequestException('Provedor OAuth inválido. Use "google" ou "github"');
    }

    const result = await this.authService.handleOAuthCallback(
      provider as 'google' | 'github',
      data.code,
      data.state,
      data.redirectUri,
    );

    return { success: true, data: result };
  }
}

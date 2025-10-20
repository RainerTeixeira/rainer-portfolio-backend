import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
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
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '📝 Registrar Usuário' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'SenhaForte123!' },
        username: { type: 'string', example: 'usuario' },
        name: { type: 'string', example: 'Nome Completo' },
      },
      required: ['email', 'password', 'username', 'name'],
    },
  })
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
  async forgotPassword(@Body() data: ForgotPasswordData) {
    return await this.authService.forgotPassword(data);
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
  async resetPassword(@Body() data: ResetPasswordData) {
    return await this.authService.resetPassword(data);
  }
}
